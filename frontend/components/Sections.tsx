import type { CSSProperties } from "react";
import { Pipeline } from "./Pipeline";
import { TrustLive } from "./TrustLive";
import { GENLAYER_EXPLORER_URL } from "@/lib/genlayer/network";

const swatch = (color: string) => ({ "--c": color }) as CSSProperties;

export function Hero() {
  return (
    <header className="hero" id="top">
      <svg className="tangle" viewBox="0 0 700 420" aria-hidden="true">
        <path className="stroke" style={{ stroke: "#d9d2c2", strokeWidth: 2 }} d="M10 300C90 40 160 400 240 180S330 20 400 210 520 380 560 120 650 60 695 160" />
        <path className="stroke" style={{ stroke: "#d9d2c2", strokeWidth: 2 }} d="M0 120C120 330 200 -10 300 230S440 330 480 80 610 300 700 240" />
        <path className="stroke" style={{ stroke: "#e8c9bf", strokeWidth: 2 }} d="M30 380C150 200 190 330 310 120S470 250 560 330 660 200 700 330" />
      </svg>
      <div className="wrap">
        <span className="pill">
          <i />
          Live on GenLayer Studio
        </span>
        <h1>Pay for the fix, not the promise.</h1>
        <p className="lede">
          Lock a bounty on any GitHub issue. When someone submits a fix, GenLayer validators read the issue and the change,
          then the contract pays out by what the code actually does.
        </p>
        <div className="hero-cta">
          <a className="btn spark" href="#app">
            Post a bounty
          </a>
          <a className="btn" href="#how">
            See how it works
          </a>
        </div>
        <div className="chips">
          <span>Funds held by the contract</span>
          <span>Validators read the code</span>
          <span>One appeal</span>
          <span>Paid out automatically</span>
        </div>
        <Pipeline />
      </div>
    </header>
  );
}

export function HowItWorks() {
  return (
    <section className="block" id="how">
      <div className="wrap">
        <div className="sec-head">
          <h2>From open issue to paid fix in four moves.</h2>
          <p className="lede">No middleman reviews the work and nobody chases an invoice. The rules are written down before anyone starts.</p>
        </div>
        <div className="steps">
          <article className="step">
            <div className="art">
              <svg viewBox="0 0 200 110" aria-hidden="true">
                <rect x="14" y="14" width="172" height="26" rx="8" fill="#fffdf8" stroke="#1c1b18" strokeWidth="2" />
                <text x="26" y="32" fontSize="11" fontFamily="monospace" fill="#6f6b62">github.com/acme/app/issues/42</text>
                <rect x="14" y="52" width="108" height="26" rx="8" fill="#fffdf8" stroke="#1c1b18" strokeWidth="2" />
                <text x="26" y="70" fontSize="12" fontWeight="700" fill="#1c1b18">10 GEN</text>
                <rect x="132" y="52" width="54" height="26" rx="13" fill="#e8452c" />
                <text x="144" y="70" fontSize="12" fontWeight="700" fill="#fff">Lock</text>
                <path d="M16 96h168" stroke="#d9d2c2" strokeWidth="2" strokeDasharray="3 6" />
              </svg>
            </div>
            <span className="n">1</span>
            <h3>Fund the issue</h3>
            <p>Paste the issue link, say what fixed means, and lock the reward in the contract.</p>
          </article>
          <article className="step">
            <div className="art">
              <svg viewBox="0 0 200 110" aria-hidden="true">
                <rect x="14" y="16" width="172" height="78" rx="10" fill="#fffdf8" stroke="#1c1b18" strokeWidth="2" />
                <path d="M28 40h50" stroke="#2f6b4f" strokeWidth="5" strokeLinecap="round" />
                <path d="M28 56h84" stroke="#e8452c" strokeWidth="5" strokeLinecap="round" />
                <path d="M28 72h64" stroke="#2f6b4f" strokeWidth="5" strokeLinecap="round" />
                <rect x="124" y="28" width="52" height="22" rx="11" fill="#1c1b18" />
                <text x="133" y="43" fontSize="11" fontFamily="monospace" fill="#faf8f3">a41f9c2</text>
              </svg>
            </div>
            <span className="n">2</span>
            <h3>Submit a fix</h3>
            <p>A contributor links a commit in the same repository. A commit hash cannot change later, and the bounty holds for them.</p>
          </article>
          <article className="step">
            <div className="art">
              <svg viewBox="0 0 200 110" aria-hidden="true">
                <g fill="#fffdf8" stroke="#1c1b18" strokeWidth="2">
                  <circle cx="46" cy="55" r="22" />
                  <circle cx="100" cy="55" r="22" />
                  <circle cx="154" cy="55" r="22" />
                </g>
                <path d="M36 56l8 8 14-16M90 56l8 8 14-16" fill="none" stroke="#2f6b4f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M146 48l16 16M162 48l-16 16" stroke="#e8452c" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <span className="n">3</span>
            <h3>Validators judge</h3>
            <p>Each validator reads the issue and the change, then votes fixed, partial, or not fixed. Either side can appeal once.</p>
          </article>
          <article className="step">
            <div className="art">
              <svg viewBox="0 0 200 110" aria-hidden="true">
                <rect x="14" y="38" width="172" height="32" rx="9" fill="#fffdf8" stroke="#1c1b18" strokeWidth="2" />
                <rect x="16" y="40" width="120" height="28" rx="7" fill="#2f6b4f" />
                <rect x="136" y="40" width="48" height="28" rx="7" fill="#1c1b18" />
                <path d="M100 18l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#e8452c" />
              </svg>
            </div>
            <span className="n">4</span>
            <h3>Settle</h3>
            <p>Anyone can trigger settlement. The contributor is paid and any unpaid remainder goes back to the funder.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Payouts() {
  return (
    <section className="block" id="payouts" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="sec-head">
          <h2>Three rulings. Three predictable payouts.</h2>
          <p className="lede">The funder picks how much a partial fix earns when posting the bounty, so contributors know the stakes before they start.</p>
        </div>
        <div className="verdicts">
          <article className="verdict fixed">
            <h3>Fixed</h3>
            <div className="bar" aria-hidden="true">
              <b className="to-fixer" style={{ flex: 100 }}>Contributor</b>
            </div>
            <div className="legend">
              <span style={swatch("var(--moss)")}>Contributor gets the full reward</span>
            </div>
            <p>The change resolves the issue and meets every criterion the funder wrote. The bounty closes.</p>
          </article>
          <article className="verdict partial">
            <h3>Partial</h3>
            <div className="bar" aria-hidden="true">
              <b className="to-fixer" style={{ flex: 50 }}>Contributor</b>
              <b className="to-funder" style={{ flex: 50 }}>Funder</b>
            </div>
            <div className="legend">
              <span style={swatch("var(--moss)")}>Share set by the funder</span>
              <span style={swatch("var(--ink)")}>Remainder refunded</span>
            </div>
            <p>A meaningful part is done but something required is missing. The bounty closes and the rest returns.</p>
          </article>
          <article className="verdict nofix">
            <h3>Not fixed</h3>
            <div className="bar" aria-hidden="true">
              <b className="reopen" style={{ flex: 100 }}>Bounty reopens</b>
            </div>
            <div className="legend">
              <span style={swatch("var(--spark)")}>Nothing is paid</span>
            </div>
            <p>The change is unrelated or does not solve it. The money stays locked and the next contributor can try.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Trust() {
  return (
    <section className="block" id="trust" style={{ paddingTop: 20 }}>
      <div className="wrap split">
        <div>
          <h2>The contract holds the money. Nobody else can move it.</h2>
          <div className="rules" style={{ marginTop: 30 }}>
            <div>
              <b>Rules are fixed before work starts.</b>
              <span>Reward, partial share, and acceptance criteria are written on-chain when the bounty is posted.</span>
            </div>
            <div>
              <b>Judging is a network vote.</b>
              <span>Validators fetch the issue and the fix on their own and must agree on the ruling. Text inside either page cannot give them orders.</span>
            </div>
            <div>
              <b>Evidence cannot be rewritten.</b>
              <span>Fixes are pinned to a commit hash, and the text validators read is saved on-chain with the ruling, so editing a web page later changes nothing.</span>
            </div>
            <div>
              <b>Nothing gets stuck.</b>
              <span>If a claim is never judged, anyone can release it after the deadline and the funder can take the money back. A judged claim can be settled by anyone.</span>
            </div>
            <div>
              <b>Fixes must match the repository.</b>
              <span>A link to a different repo is rejected, and funders cannot claim their own bounty.</span>
            </div>
          </div>
          <TrustLive />
        </div>
        <pre className="code" aria-label="How a payout is calculated">
          <span className="c"># what settle_claim does with a ruling</span>
          {"\n"}
          <span className="k">if</span> verdict == <span className="g">&quot;FIXED&quot;</span>:{"\n"}
          {"    payout = reward\n"}
          <span className="k">elif</span> verdict == <span className="g">&quot;PARTIAL&quot;</span>:{"\n"}
          {"    payout = reward * partial_bps // 10000\n"}
          <span className="k">else</span>:{"\n"}
          {"    "}
          <span className="c"># reopen the bounty, pay nothing</span>
          {"\n    payout = 0\n\n"}
          {"fee       = payout * fee_bps // 10000\n"}
          {"to_fixer  = payout - fee\n"}
          {"to_funder = reward - payout\n\n"}
          <span className="c"># nothing is created or lost</span>
          {"\n"}
          <span className="k">assert</span> to_fixer + fee + to_funder == reward
        </pre>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot">
        <a className="brand" href="#top" style={{ fontSize: 18 }}>
          FixProof
        </a>
        <span>Built on GenLayer Studio. Bounties are held and paid by an Intelligent Contract.</span>
        <a href={GENLAYER_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
          Explorer
        </a>
      </div>
    </footer>
  );
}
