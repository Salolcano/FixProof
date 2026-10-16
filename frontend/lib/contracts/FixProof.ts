import { createGenLayerClient } from "../genlayer/client";
import type { Board, Bounty, BountyStatus, Claim, ClaimStatus, Config, Reputation, Verdict } from "./types";

type Rec = Record<string, unknown>;

/** Contract replies can arrive as Maps or objects; turn both into plain objects. */
function norm(value: unknown): unknown {
  if (value instanceof Map) {
    const out: Rec = {};
    value.forEach((v, k) => {
      out[String(k)] = norm(v);
    });
    return out;
  }
  if (Array.isArray(value)) return value.map(norm);
  if (value && typeof value === "object") {
    const out: Rec = {};
    for (const [k, v] of Object.entries(value as Rec)) out[k] = norm(v);
    return out;
  }
  return value;
}

/** Some clients hand back the whole reply as JSON text; unwrap only that outer layer. */
function unwrap(reply: unknown): unknown {
  if (typeof reply === "string" && (reply.startsWith("{") || reply.startsWith("["))) {
    try {
      return JSON.parse(reply);
    } catch {
      return reply;
    }
  }
  return reply;
}

const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const num = (v: unknown): number => Number(v ?? 0);
const text = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

function toBounty(raw: unknown): Bounty {
  const r = rec(raw);
  return {
    id: num(r.bounty_id),
    funder: text(r.funder),
    issueUrl: text(r.issue_url),
    repo: text(r.repo),
    criteria: text(r.criteria),
    reward: text(r.reward) || "0",
    partialBps: num(r.partial_bps),
    status: text(r.status) as BountyStatus,
    activeClaim: num(r.active_claim),
    createdAt: num(r.created_at),
  };
}

function toClaim(raw: unknown): Claim {
  const r = rec(raw);
  return {
    id: num(r.claim_id),
    bountyId: num(r.bounty_id),
    fixer: text(r.fixer),
    fixUrl: text(r.fix_url),
    note: text(r.note),
    status: text(r.status) as ClaimStatus,
    verdict: text(r.verdict) as Verdict,
    confidence: num(r.confidence),
    reason: text(r.reason),
    judgedAt: num(r.judged_at),
    appealed: r.appealed === true || r.appealed === "true",
    payout: text(r.payout) || "0",
    fee: text(r.fee) || "0",
    submittedAt: num(r.submitted_at),
    issueSnapshot: text(r.issue_snapshot),
    fixSnapshot: text(r.fix_snapshot),
  };
}

const PAGE = 30; // newest bounties shown on the board

/** Read-only calls to the deployed FixProof contract. Writes go through Transaction Kit. */
export default class FixProof {
  private address: `0x${string}`;
  private client: any;

  constructor(address: string, account?: string | null) {
    this.address = address as `0x${string}`;
    this.client = createGenLayerClient(account);
  }

  private async call(functionName: string, args: unknown[] = []): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const reply = await this.client.readContract({
          address: this.address,
          functionName,
          args,
          jsonSafeReturn: true,
        });
        return norm(unwrap(reply));
      } catch (err) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Could not read the contract");
  }

  async getConfig(): Promise<Config> {
    const r = rec(await this.call("get_config"));
    return {
      owner: text(r.owner),
      feeBps: num(r.fee_bps),
      appealWindow: num(r.appeal_window),
      judgeDeadline: num(r.judge_deadline),
      treasury: text(r.treasury) || "0",
    };
  }

  async getBoard(): Promise<Board> {
    const next = (await this.call("get_next_ids")) as unknown[];
    const last = num(Array.isArray(next) ? next[0] : 1) - 1;
    const first = Math.max(1, last - PAGE + 1);
    const ids: number[] = [];
    for (let id = last; id >= first; id--) ids.push(id);

    const bounties = await Promise.all(ids.map(async (id) => toBounty(await this.call("get_bounty", [BigInt(id)]))));
    const open = bounties.filter((b) => b.activeClaim > 0);
    const claims = await Promise.all(open.map(async (b) => toClaim(await this.call("get_claim", [BigInt(b.activeClaim)]))));

    const byBounty: Record<number, Claim> = {};
    claims.forEach((c) => {
      byBounty[c.bountyId] = c;
    });
    return { bounties, claims: byBounty };
  }

  async getReputation(who: string): Promise<Reputation> {
    const r = rec(await this.call("get_reputation", [who]));
    return {
      fixed: num(r.fixed_count),
      partial: num(r.partial_count),
      rejected: num(r.rejected_count),
      earned: text(r.total_earned) || "0",
    };
  }
}
