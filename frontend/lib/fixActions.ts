import type { SubmitInput } from "@genlayer/transaction-kit-react";
import type { Bounty, Claim, Config } from "./contracts/types";

/** Everything a person can do to a bounty or claim from the app. */
export type FixAction = "submit" | "judge" | "appeal" | "settle" | "expire" | "cancel" | "withdraw";

export const ACTION_METHOD: Record<FixAction, string> = {
  submit: "submit_fix",
  judge: "judge_claim",
  appeal: "appeal_claim",
  settle: "settle_claim",
  expire: "expire_claim",
  cancel: "cancel_bounty",
  withdraw: "withdraw_claim",
};

export const ACTION_COPY: Record<FixAction, { title: string; description: string; done: string; doneNote: string }> = {
  submit: {
    title: "Submit your fix",
    description: "The bounty is held for you while validators review your commit.",
    done: "Fix submitted",
    doneNote: "Next, ask the validators to judge it.",
  },
  judge: {
    title: "Ask validators to judge",
    description: "Validators will read the issue and the commit, then agree on a ruling. This can take a minute or two.",
    done: "Ruling recorded",
    doneNote: "The evidence the validators read is shown on the bounty.",
  },
  appeal: {
    title: "Appeal the ruling",
    description: "Validators look again, using the evidence saved at the first ruling. You can appeal once.",
    done: "Appeal decided",
    doneNote: "The ruling is now final and can be settled.",
  },
  settle: {
    title: "Settle and pay out",
    description: "The contract pays the contributor and refunds any unpaid remainder to the funder.",
    done: "Settled",
    doneNote: "Funds have moved as the ruling says.",
  },
  expire: {
    title: "Release this stalled claim",
    description: "Nobody judged this claim in time, so the bounty reopens and the funder can take the money back.",
    done: "Claim released",
    doneNote: "The bounty is open again.",
  },
  cancel: {
    title: "Cancel and refund",
    description: "No claim is in flight, so you can take your locked GEN back.",
    done: "Bounty cancelled",
    doneNote: "Your GEN is on its way back.",
  },
  withdraw: {
    title: "Withdraw your fix",
    description: "Your claim has not been judged yet, so you can pull it and reopen the bounty.",
    done: "Fix withdrawn",
    doneNote: "The bounty is open again.",
  },
};

const ISSUE_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}\/issues\/[0-9]{1,9}$/;
const COMMIT_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}\/commit\/[0-9a-fA-F]{40}$/;

export const isIssueUrl = (value: string): boolean => ISSUE_URL.test(value.trim());
export const isCommitUrl = (value: string): boolean => COMMIT_URL.test(value.trim());

/** owner/repo (lower case) of a GitHub link, or "" when it is not one. */
export function repoOf(url: string): string {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\//.exec(url.trim());
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : "";
}

function writeTx(contract: string, method: string, args: unknown[]): SubmitInput {
  return { kind: "write", address: contract as `0x${string}`, method, args } as unknown as SubmitInput;
}

/** The transaction that posts a bounty. The reward is attached separately as userValue. */
export function createBountyTx(contract: string, issueUrl: string, criteria: string, partialPercent: number): SubmitInput {
  return writeTx(contract, "create_bounty", [issueUrl.trim(), criteria.trim(), BigInt(partialPercent * 100)]);
}

/** The transaction for an action. `text` is the fix link (submit) or the appeal reason (appeal). */
export function buildActionTx(contract: string, action: FixAction, id: number, text = "", note = ""): SubmitInput {
  const args: unknown[] =
    action === "submit" ? [BigInt(id), text.trim(), note.trim()] : action === "appeal" ? [BigInt(id), text.trim()] : [BigInt(id)];
  return writeTx(contract, ACTION_METHOD[action], args);
}

export interface Permissions {
  isFunder: boolean;
  isFixer: boolean;
  canSubmit: boolean;
  canCancel: boolean;
  canJudge: boolean;
  canWithdraw: boolean;
  canExpire: boolean;
  canAppeal: boolean;
  canSettle: boolean;
  appealEndsAt: number;
}

/**
 * What the connected wallet may do. This mirrors the contract's own rules, so a
 * button only appears when the contract would accept the call.
 */
export function availableActions(
  bounty: Bounty,
  claim: Claim | undefined,
  viewer: string | null,
  now: number,
  config: Config | undefined,
): Permissions {
  const me = viewer?.toLowerCase() ?? "";
  const isFunder = !!me && me === bounty.funder.toLowerCase();
  const isFixer = !!me && !!claim && me === claim.fixer.toLowerCase();
  const window = config?.appealWindow ?? 0;
  const deadline = config?.judgeDeadline ?? 0;
  const appealEndsAt = claim ? claim.judgedAt + window : 0;

  return {
    isFunder,
    isFixer,
    appealEndsAt,
    canSubmit: !!me && !isFunder && bounty.status === "OPEN",
    canCancel: isFunder && bounty.status === "OPEN",
    canJudge: !!claim && claim.status === "SUBMITTED",
    canWithdraw: !!claim && claim.status === "SUBMITTED" && isFixer,
    canExpire: !!claim && claim.status === "SUBMITTED" && !!config && now > claim.submittedAt + deadline,
    canAppeal: !!claim && claim.status === "JUDGED" && !claim.appealed && (isFixer || isFunder) && now <= appealEndsAt,
    canSettle: !!claim && (claim.status === "FINAL" || (claim.status === "JUDGED" && now > appealEndsAt)),
  };
}

/** "3h 12m left" style text for a deadline, or "closed". */
export function timeLeft(deadline: number, now: number): string {
  const seconds = deadline - now;
  if (seconds <= 0) return "closed";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes} min left`;
  return `${seconds}s left`;
}
