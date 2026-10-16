"use client";

import { useEffect } from "react";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { useWallet } from "@/lib/genlayer/wallet";
import { useInvalidateBoard } from "@/lib/hooks/useFixProof";
import { error, success } from "@/lib/utils/toast";

/** One transaction the person is about to send. */
export interface PendingTx {
  tx: SubmitInput;
  title: string;
  description: string;
  doneTitle: string;
  doneDescription: string;
  /** GEN to attach, in the smallest unit. Only payable calls use this. */
  value?: bigint;
}

/**
 * Shows the Transaction Kit panel for a pending call: the fee quote, the wallet
 * confirmation, and live tracking until validators decide.
 */
export function TxDialog({ pending, onClose }: { pending: PendingTx | null; onClose: () => void }) {
  const { address } = useWallet();
  const kit = useTransactionKit(address);
  const invalidate = useInvalidateBoard();

  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  if (!pending) return null;

  const handleDone = (status: TrackedStatus) => {
    invalidate();
    if (status.successful !== false) {
      success(pending.doneTitle, { description: pending.doneDescription });
      onClose();
      return;
    }
    error("The transaction did not succeed", {
      description: "It finished without a successful outcome. Nothing was changed.",
    });
  };

  const payable = pending.value !== undefined ? { userValue: pending.value } : {};

  return (
    <div className="modal-back" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={pending.title}>
        <div className="modal-head">
          <h3>{pending.title}</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="lede" style={{ fontSize: 16 }}>
          {pending.description}
        </p>
        {kit ? (
          <div className="tx-plate">
            <GenLayerTransactionPanel
              kit={kit}
              tx={pending.tx}
              {...payable}
              network={GENLAYER_NETWORK.chainName}
              theme="dark"
              trackUntil="decided"
              onDone={handleDone}
            />
          </div>
        ) : (
          <p className="field-error">Connect your wallet to continue.</p>
        )}
      </div>
    </div>
  );
}
