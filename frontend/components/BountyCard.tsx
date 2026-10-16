"use client";

import { useState } from "react";
import type { Bounty, Claim, Config } from "@/lib/contracts/types";
import {
  ACTION_COPY,
  availableActions,
  buildActionTx,
  isCommitUrl,
  repoOf,
  timeLeft,
  type FixAction,
} from "@/lib/fixActions";
import { formatGen } from "@/lib/utils/gen";
import { shortAddress } from "@/lib/utils";
import type { PendingTx } from "./TxDialog";

const STATUS_NAME: Record<string, string> = {
  OPEN: "Open",
  CLAIMED: "In review",
  CLOSED: "Paid out",
  CANCELLED: "Cancelled",
};

const VERDICT_NAME: Record<string, string> = {
  FIXED: "Ruled fixed",
  PARTIAL: "Ruled partial",
  NOT_FIXED: "Ruled not fixed",
  PENDING: "Waiting for a ruling",
};

const isGithubLink = (url: string) => /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(issues|commit)\/\w+$/.test(url);

interface Props {
  bounty: Bounty;
  claim: Claim | undefined;
  contractAddress: string;
  viewer: string | null;
  connected: boolean;
  now: number;
  config: Config | undefined;
  onPending: (pending: PendingTx) => void;
  onConnect: () => Promise<void>;
}

export function BountyCard({ bounty, claim, contractAddress, viewer, connected, now, config, onPending, onConnect }: Props) {
  const [fixUrl, setFixUrl] = useState("");
  const [note, setNote] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [formError, setFormError] = useState("");

  const can = availableActions(bounty, claim, viewer, now, config);

  const start = (action: FixAction, id: number, text = "", extra = "") => {
    const copy = ACTION_COPY[action];
    onPending({
      tx: buildActionTx(contractAddress, action, id, text, extra),
      title: copy.title,
      description: copy.description,
      doneTitle: copy.done,
      doneDescription: copy.doneNote,
    });
  };

  const submitFix = async () => {
    if (!isCommitUrl(fixUrl)) {
      setFormError("Paste a GitHub commit link that includes the full 40-character hash.");
      return;
    }
    if (repoOf(fixUrl) !== bounty.repo.toLowerCase()) {
      setFormError(`The commit must be in ${bounty.repo}.`);
      return;
    }
    setFormError("");
    if (!connected) await onConnect();
    start("submit", bounty.id, fixUrl, note);
  };

  const appeal = () => {
    if (!claim) return;
    if (appealReason.trim().length < 5) {
      setFormError("Say why validators should look again.");
      return;
    }
    setFormError("");
    start("appeal", claim.id, appealReason);
  };

  const issueNumber = bounty.issueUrl.split("/").pop();

  return (
    <article className="card" data-status={bounty.status}>
      <div className="card-head">
        <div className="t">
          {isGithubLink(bounty.issueUrl) ? (
            <a href={bounty.issueUrl} target="_blank" rel="noopener noreferrer">
              {bounty.repo} issue #{issueNumber}
            </a>
          ) : (
            <span>{bounty.issueUrl}</span>
          )}
          <div className="meta">
            <span>Posted by {shortAddress(bounty.funder)}</span>
            <span>Partial fix pays {bounty.partialBps / 100}%</span>
          </div>
        </div>
        <span className={`status ${bounty.status.toLowerCase()}`}>{STATUS_NAME[bounty.status] ?? bounty.status}</span>
        <div className="reward">
          {formatGen(bounty.reward)} <small>GEN</small>
        </div>
      </div>

      <div className="crit">{bounty.criteria}</div>

      {bounty.status === "OPEN" && can.canCancel && (
        <div className="actions">
          <button className="btn small" type="button" onClick={() => start("cancel", bounty.id)}>
            Cancel and refund me
          </button>
        </div>
      )}

      {bounty.status === "OPEN" && !can.isFunder && (
        <div className="inline">
          <input
            value={fixUrl}
            onChange={(e) => setFixUrl(e.target.value)}
            placeholder={`https://github.com/${bounty.repo}/commit/ plus the full 40-character hash`}
            aria-label="Link to your commit"
            autoComplete="off"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={600}
            placeholder="One line about what you changed (optional)"
            aria-label="Note"
          />
          {formError && <span className="field-error">{formError}</span>}
          <div className="actions">
            <button className="btn small spark" type="button" onClick={submitFix}>
              {connected ? "Submit my fix" : "Connect wallet to submit"}
            </button>
          </div>
        </div>
      )}

      {claim && bounty.status === "CLAIMED" && (
        <div className={`claim v-${claim.verdict}`}>
          <div className="vd">
            {VERDICT_NAME[claim.verdict] ?? claim.verdict}
            {claim.verdict !== "PENDING" && <span className="meta">confidence {claim.confidence}%</span>}
          </div>
          <div className="meta">
            <span>Fix by {shortAddress(claim.fixer)}</span>
            {isGithubLink(claim.fixUrl) && (
              <a href={claim.fixUrl} target="_blank" rel="noopener noreferrer">
                View the fix
              </a>
            )}
          </div>
          {claim.note && <div className="why">“{claim.note}”</div>}
          {claim.reason && <div className="why">{claim.reason}</div>}
          {(claim.issueSnapshot || claim.fixSnapshot) && (
            <details className="why">
              <summary>Evidence the validators read</summary>
              <div className="crit" style={{ marginTop: 8 }}>
                <b>Issue</b>
                {"\n"}
                {claim.issueSnapshot}
                {"\n\n"}
                <b>Fix</b>
                {"\n"}
                {claim.fixSnapshot}
              </div>
            </details>
          )}
          {claim.status === "JUDGED" && <span className="meta">Appeal window: {timeLeft(can.appealEndsAt, now)}</span>}
          {claim.status === "FINAL" && <span className="meta">Appeal used. The ruling is final.</span>}

          {can.canAppeal && (
            <div className="inline">
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                maxLength={600}
                placeholder="Why should validators look again?"
                aria-label="Appeal reason"
              />
              {formError && <span className="field-error">{formError}</span>}
              <div className="actions">
                <button className="btn small" type="button" onClick={appeal}>
                  Appeal once
                </button>
              </div>
            </div>
          )}

          <div className="actions">
            {can.canJudge && (
              <button className="btn small spark" type="button" onClick={() => start("judge", claim.id)}>
                Ask validators to judge
              </button>
            )}
            {can.canWithdraw && (
              <button className="btn small" type="button" onClick={() => start("withdraw", claim.id)}>
                Withdraw my fix
              </button>
            )}
            {can.canExpire && (
              <button className="btn small" type="button" onClick={() => start("expire", claim.id)}>
                Release this stalled claim
              </button>
            )}
            {can.canSettle && (
              <button className="btn small spark" type="button" onClick={() => start("settle", claim.id)}>
                Settle and pay out
              </button>
            )}
          </div>
        </div>
      )}

      {bounty.status === "CLOSED" && <div className="meta">This bounty was paid out.</div>}
    </article>
  );
}
