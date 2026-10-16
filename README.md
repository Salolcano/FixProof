# FixProof

Pay for the fix, not the promise. Built on GenLayer.

A funder locks GEN against a GitHub issue and writes down what "fixed" means. A contributor submits a commit that fixes it. The Intelligent Contract reads the issue and the commit, GenLayer validators agree on a ruling (fixed, partial, or not fixed), and the contract pays out by that ruling.

GenLayer is the core of the workflow: a normal smart contract cannot read a GitHub issue and a code change and decide whether one resolves the other.

## Network

- Network: GenLayer Studio
- RPC: https://studio.genlayer.com/api
- Chain ID: 61999
- Explorer: https://explorer-studio.genlayer.com
- Deployed contract: *(set after deploying `contracts/fixproof.py`, see below)*

## Project structure

```
contracts/fixproof.py     # FixProof Intelligent Contract
frontend/                 # Next.js app (Transaction Kit, genlayer-js)
deploy/deployScript.ts    # Deployment script used by `genlayer deploy`
config/                   # Network settings for Python tools
tests/unit/               # Unit tests for the contract logic
```

## Contract

`contracts/fixproof.py`

| Method | Type | What it does |
| --- | --- | --- |
| `create_bounty(issue_url, criteria, partial_bps)` | write, payable | The funder locks the attached GEN against an issue |
| `submit_fix(bounty_id, fix_url, note)` | write | A contributor claims the bounty with a commit link |
| `judge_claim(claim_id)` | write | Validators read the issue and the commit and rule |
| `appeal_claim(claim_id, appeal_reason)` | write | The contributor or funder asks for one more look |
| `settle_claim(claim_id)` | write | Anyone pays out a final ruling |
| `expire_claim(claim_id)` | write | Anyone releases a claim nobody judged in time |
| `cancel_bounty(bounty_id)` | write | The funder takes the GEN back while the bounty is open |
| `withdraw_claim(claim_id)` | write | The contributor pulls an unjudged claim |
| `withdraw_fees()` | write | The owner collects the platform fee |
| `get_bounty`, `get_claim`, `get_reputation`, `get_config`, `get_next_ids` | view | Read state |

### Payouts

| Ruling | Contributor | Funder | Bounty |
| --- | --- | --- | --- |
| Fixed | full reward, minus fee | nothing | closed |
| Partial | the share the funder set, minus fee | the remainder | closed |
| Not fixed | nothing | nothing | reopens for the next contributor |

The fee (`fee_bps`, at most 5%) is taken from what the contributor earns. The contract always satisfies `to_fixer + fee + to_funder == reward`.

### Exits: nothing gets stuck

| Situation | Who can act | Result |
| --- | --- | --- |
| Bounty open, no claim | Funder: `cancel_bounty` | Full reward back |
| Claim never judged | Anyone, after `judge_deadline`: `expire_claim` | Bounty reopens, funder can cancel |
| Claim judged | Anyone: `settle_claim` once the appeal window closes | Paid out as ruled |
| Claim appealed | Anyone: `settle_claim` right away | Paid out as ruled |

### Evidence

Web pages change, so the contract does not rely on them staying put.

- Fixes must be commit links with the full 40-character hash. A commit cannot change after it is judged. Pull request pages are rejected.
- At the first ruling, the text of the issue and the commit that validators read is saved on the claim and shown in the app.
- An appeal judges the saved issue text together with the commit, so editing the issue afterwards cannot flip the outcome.
- The funder's acceptance criteria are written on-chain when the bounty is posted.

### How the ruling works

`judge_claim` makes each validator fetch the issue page and the commit page with `gl.nondet.web.render`, then answer with `{"verdict", "confidence", "reason"}`. The page text is fenced as untrusted data in the prompt. Output is parsed strictly: the verdict must be exactly `FIXED`, `PARTIAL` or `NOT_FIXED`, confidence must be a whole number from 0 to 100, and a reason is required. `gl.eq_principle.prompt_comparative` makes validators agree on the verdict. An unreadable page fails the call instead of counting as a rejection.

Known limitations: the funder writes the criteria and the contributor picks the commit, so this is a demonstration of consensus verification, not a replacement for a trusted escrow service. Snapshots are excerpts (the first 1,500 characters of each page), not a cryptographic commitment to the whole page.

## Tests

The contract logic runs with plain `pytest` and needs no GenLayer tooling:

```
pip install -r requirements.txt
pytest tests/unit/ -v
```

The tests run the real contract file through the full lifecycle (funding, cancel, judging, appeal, settle, expiry, fee withdrawal, who may call what, money conservation) using a small stand-in for the GenLayer runtime in `tests/unit/harness.py`. That harness is not the GenLayer VM, so it checks the contract's logic, not validator consensus on Studio.

## Deploy without writing any code

### 1. Deploy the contract on GenLayer Studio

1. Open https://studio.genlayer.com and choose the Studio network (chain 61999).
2. Create a contract file, paste in everything from `contracts/fixproof.py`, and open the Deploy panel.
3. Fill in the three constructor values and deploy:

   | Value | Enter | Meaning |
   | --- | --- | --- |
   | `fee_bps` | `100` | Platform fee, 100 = 1% (maximum 500) |
   | `appeal_window` | `300` | Seconds either side can appeal after a ruling |
   | `judge_deadline` | `3600` | Seconds a claim can wait for judging before anyone can release it (minimum 30) |

4. Copy the contract address that appears after deployment.

### 2. Put the app on Vercel

1. Upload this repository to GitHub.
2. In Vercel choose **Add New, Project** and import the repository.
3. Set **Root Directory** to `frontend`. Leave the framework as Next.js.
4. Open **Environment Variables** and add `NEXT_PUBLIC_CONTRACT_ADDRESS` with your contract address.
5. Press **Deploy**.

If you forget step 4, the app asks you to paste the address on the page. That works for a quick try, but only in your own browser, so set the variable before sharing the link.

### 3. Try it

You need MetaMask. The app adds and switches to GenLayer Studio for you.

1. **Post a bounty** on a public GitHub issue and describe what fixed means.
2. With a second wallet, **submit a fix** using a commit link (full 40-character hash) from the same repository.
3. Press **Ask validators to judge**. This takes a minute or two.
4. After the appeal window, press **Settle and pay out**.

Every write goes through the Transaction Kit panel, which shows the fee quote and tracks the transaction until validators decide.

## Environment variables

Set these in Vercel under Settings, Environment Variables. Only the first one is required.

| Name | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | none | The deployed FixProof contract |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | `https://studio.genlayer.com/api` | Network RPC |
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | `61999` | Network chain ID |
| `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` | `GenLayer Studio` | Name shown in the wallet |
| `NEXT_PUBLIC_GENLAYER_SYMBOL` | `GEN` | Currency symbol |
| `NEXT_PUBLIC_GENLAYER_EXPLORER_URL` | `https://explorer-studio.genlayer.com` | Explorer links |

## License

MIT
