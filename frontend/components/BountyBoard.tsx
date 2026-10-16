"use client";

import { useState } from "react";
import type { Reputation } from "@/lib/contracts/types";
import { createBountyTx, isIssueUrl } from "@/lib/fixActions";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/wallet";
import { useBoard, useConfig, useContractAddress, useFixProofContract, useNow } from "@/lib/hooks/useFixProof";
import { formatGen, isAddress, parseGen } from "@/lib/utils/gen";
import { shortAddress } from "@/lib/utils";
import { BountyCard } from "./BountyCard";
import { TxDialog, type PendingTx } from "./TxDialog";

type Tab = "browse" | "post" | "rep";
type Filter = "all" | "OPEN" | "CLAIMED" | "CLOSED";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "CLAIMED", label: "In review" },
  { id: "CLOSED", label: "Paid out" },
];

const NO_ERRORS = { issue: "", criteria: "", reward: "", partial: "" };

export function BountyBoard() {
  const { address: wallet, isConnected, connectWallet } = useWallet();
  const { address: contractAddress, setAddress } = useContractAddress();
  const contract = useFixProofContract();
  const board = useBoard();
  const config = useConfig();
  const now = useNow();

  const [tab, setTab] = useState<Tab>("browse");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<PendingTx | null>(null);

  const [addressInput, setAddressInput] = useState("");
  const [addressError, setAddressError] = useState("");

  const [issueUrl, setIssueUrl] = useState("");
  const [criteria, setCriteria] = useState("");
  const [reward, setReward] = useState("");
  const [partial, setPartial] = useState("50");
  const [errors, setErrors] = useState(NO_ERRORS);

  const [repInput, setRepInput] = useState("");
  const [rep, setRep] = useState<Reputation | null>(null);
  const [repError, setRepError] = useState("");

  const connect = async () => {
    try {
      await connectWallet();
    } catch {
      // connectWallet already explains the problem in a toast
    }
  };

  const saveAddress = () => {
    if (!isAddress(addressInput)) {
      setAddressError("That does not look like a contract address. It starts with 0x and has 40 characters after it.");
      return;
    }
    setAddressError("");
    setAddress(addressInput.trim());
  };

  const postBounty = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = { ...NO_ERRORS };
    const percent = Number(partial);
    const wei = parseGen(reward);

    if (!isIssueUrl(issueUrl)) next.issue = "Use a GitHub issue link like https://github.com/owner/repo/issues/123";
    if (criteria.trim().length < 20) next.criteria = "Write at least 20 characters so validators know what fixed means.";
    if (criteria.trim().length > 1500) next.criteria = "Keep this under 1500 characters.";
    if (wei === null) next.reward = "Enter the reward as a number, like 10 or 2.5.";
    if (!Number.isInteger(percent) || percent < 1 || percent > 99) next.partial = "Use a whole number from 1 to 99.";
    setErrors(next);
    if (next.issue || next.criteria || next.reward || next.partial || wei === null) return;

    if (!contractAddress) {
      setAddressError("Set the contract address first.");
      return;
    }
    if (!isConnected) {
      try {
        await connectWallet();
      } catch {
        return;
      }
    }

    setPending({
      tx: createBountyTx(contractAddress, issueUrl, criteria, percent),
      title: "Lock the bounty",
      description: `${formatGen(wei)} GEN is held by the contract until the issue is fixed or you cancel. Validators judge any fix against the words you wrote.`,
      doneTitle: "Bounty funded",
      doneDescription: "Your GEN is now locked on GenLayer.",
      value: wei,
    });
  };

  const lookUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setRep(null);
    if (!isAddress(repInput)) {
      setRepError("Enter a full wallet address that starts with 0x.");
      return;
    }
    if (!contract) {
      setRepError("Set the contract address first.");
      return;
    }
    setRepError("");
    try {
      setRep(await contract.getReputation(repInput.trim()));
    } catch {
      setRepError("Could not read that record. Check the contract address and try again.");
    }
  };

  const rows = (board.data?.bounties ?? []).filter((b) => filter === "all" || b.status === filter);

  return (
    <div className="frame">
      <div className="chrome">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="url">{contractAddress ? `fixproof, ${shortAddress(contractAddress)}` : "fixproof, GenLayer Studio"}</span>
      </div>

      <div className="app">
        <div className="app-top">
          <div className="tabs" role="tablist" aria-label="App sections">
            <button className="tab" role="tab" aria-selected={tab === "browse"} onClick={() => setTab("browse")} type="button">
              Bounties
            </button>
            <button className="tab" role="tab" aria-selected={tab === "post"} onClick={() => setTab("post")} type="button">
              Post a bounty
            </button>
            <button className="tab" role="tab" aria-selected={tab === "rep"} onClick={() => setTab("rep")} type="button">
              Reputation
            </button>
          </div>
          <span className="spacer" />
          <span className="who">{isConnected && wallet ? shortAddress(wallet) : `Wallet not connected, ${GENLAYER_NETWORK.chainName}`}</span>
          {!isConnected && (
            <button className="btn small solid" type="button" onClick={connect}>
              Connect wallet
            </button>
          )}
        </div>

        {!contractAddress && (
          <div className="banner">
            <span>Paste the deployed FixProof contract address to start.</span>
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x…"
              aria-label="Contract address"
              autoComplete="off"
            />
            <button className="btn small solid" type="button" onClick={saveAddress}>
              Use this contract
            </button>
            {addressError && <span className="field-error">{addressError}</span>}
          </div>
        )}

        {contractAddress && board.error && (
          <div className="banner err">
            Could not read the contract. Check the address and that it is deployed on {GENLAYER_NETWORK.chainName}.
          </div>
        )}

        {tab === "browse" && (
          <div>
            <div className="filters" role="group" aria-label="Filter bounties">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
              <button type="button" style={{ marginLeft: "auto" }} onClick={() => board.refetch()}>
                Refresh
              </button>
            </div>
            <div className="list">
              {!contractAddress ? (
                <div className="empty">No contract connected yet.</div>
              ) : board.isLoading ? (
                <div className="empty">Loading bounties…</div>
              ) : rows.length === 0 ? (
                <div className="empty">{board.data && board.data.bounties.length > 0 ? "Nothing matches this filter." : "No bounties yet. Post the first one."}</div>
              ) : (
                rows.map((b) => (
                  <BountyCard
                    key={b.id}
                    bounty={b}
                    claim={board.data?.claims[b.id]}
                    contractAddress={contractAddress}
                    viewer={wallet}
                    connected={isConnected}
                    now={now}
                    config={config.data}
                    onPending={setPending}
                    onConnect={connect}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {tab === "post" && (
          <form className="form" onSubmit={postBounty} noValidate>
            <label>
              GitHub issue link
              <input
                value={issueUrl}
                onChange={(e) => setIssueUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/issues/123"
                inputMode="url"
                autoComplete="off"
              />
              {errors.issue && <span className="field-error">{errors.issue}</span>}
            </label>
            <label>
              What counts as fixed
              <textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                maxLength={1500}
                placeholder="Example: Submitting an empty password shows an error message and the app no longer crashes."
              />
              <small>Validators judge the fix against these words, so be specific.</small>
              {errors.criteria && <span className="field-error">{errors.criteria}</span>}
            </label>
            <div className="row2">
              <label>
                Reward in GEN
                <input value={reward} onChange={(e) => setReward(e.target.value)} inputMode="decimal" placeholder="10" />
                {errors.reward && <span className="field-error">{errors.reward}</span>}
              </label>
              <label>
                Pay for a partial fix (percent)
                <input value={partial} onChange={(e) => setPartial(e.target.value)} inputMode="numeric" />
                <small>Between 1 and 99. The rest is refunded to you.</small>
                {errors.partial && <span className="field-error">{errors.partial}</span>}
              </label>
            </div>
            <div>
              <button className="btn spark" type="submit">
                Review and lock the bounty
              </button>
            </div>
          </form>
        )}

        {tab === "rep" && (
          <div>
            <form className="form" onSubmit={lookUp}>
              <label>
                Contributor address
                <input
                  value={repInput}
                  onChange={(e) => setRepInput(e.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                />
                {repError && <span className="field-error">{repError}</span>}
              </label>
              <div>
                <button className="btn solid" type="submit">
                  Look up record
                </button>
              </div>
            </form>
            {rep && (
              <div className="rep">
                <div>
                  <b>{rep.fixed}</b>
                  <span>Fixed</span>
                </div>
                <div>
                  <b>{rep.partial}</b>
                  <span>Partial</span>
                </div>
                <div>
                  <b>{rep.rejected}</b>
                  <span>Not fixed</span>
                </div>
                <div>
                  <b>{formatGen(rep.earned)}</b>
                  <span>GEN earned</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TxDialog pending={pending} onClose={() => setPending(null)} />
    </div>
  );
}
