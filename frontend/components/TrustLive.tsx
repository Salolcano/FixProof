"use client";

import { useConfig, useContractAddress } from "@/lib/hooks/useFixProof";
import { GENLAYER_CHAIN_ID, GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { GENLAYER_EXPLORER_URL } from "@/lib/genlayer/network";
import { formatDuration, shortAddress } from "@/lib/utils";

/** Live facts about the deployed contract, read from the chain. */
export function TrustLive() {
  const { address } = useContractAddress();
  const config = useConfig();
  const data = config.data;

  return (
    <div className="live">
      <span>
        Network <b>{GENLAYER_NETWORK.chainName}</b>
      </span>
      <span>
        Chain <b>{GENLAYER_CHAIN_ID}</b>
      </span>
      <span>
        Contract{" "}
        {address ? (
          <b>
            <a href={`${GENLAYER_EXPLORER_URL}/address/${address}`} target="_blank" rel="noopener noreferrer" title={address}>
              {shortAddress(address)}
            </a>
          </b>
        ) : (
          <b>not set</b>
        )}
      </span>
      <span>
        Fee <b>{data ? `${data.feeBps / 100}% of payouts` : "…"}</b>
      </span>
      <span>
        Appeal window <b>{data ? formatDuration(data.appealWindow) : "…"}</b>
      </span>
      <span>
        Judging deadline <b>{data ? formatDuration(data.judgeDeadline) : "…"}</b>
      </span>
    </div>
  );
}
