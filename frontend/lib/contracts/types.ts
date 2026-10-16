export type BountyStatus = "OPEN" | "CLAIMED" | "CLOSED" | "CANCELLED";
export type ClaimStatus = "SUBMITTED" | "JUDGED" | "FINAL" | "SETTLED" | "REJECTED" | "WITHDRAWN" | "EXPIRED";
export type Verdict = "PENDING" | "FIXED" | "PARTIAL" | "NOT_FIXED";

export interface Bounty {
  id: number;
  funder: string;
  issueUrl: string;
  repo: string;
  criteria: string;
  reward: string; // smallest unit, as text
  partialBps: number;
  status: BountyStatus;
  activeClaim: number; // 0 when none
  createdAt: number;
}

export interface Claim {
  id: number;
  bountyId: number;
  fixer: string;
  fixUrl: string;
  note: string;
  status: ClaimStatus;
  verdict: Verdict;
  confidence: number;
  reason: string;
  judgedAt: number;
  appealed: boolean;
  payout: string;
  fee: string;
  submittedAt: number;
  issueSnapshot: string;
  fixSnapshot: string;
}

export interface Config {
  owner: string;
  feeBps: number;
  appealWindow: number; // seconds
  judgeDeadline: number; // seconds
  treasury: string;
}

export interface Reputation {
  fixed: number;
  partial: number;
  rejected: number;
  earned: string;
}

export interface Board {
  bounties: Bounty[];
  claims: Record<number, Claim>;
}
