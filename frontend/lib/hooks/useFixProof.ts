"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import FixProof from "../contracts/FixProof";
import type { Board, Config } from "../contracts/types";
import { ADDRESS_STORAGE_KEY, getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";

/** The contract address, resolved after the page loads so server and browser agree on first paint. */
export function useContractAddress() {
  const [address, setAddressState] = useState("");

  useEffect(() => {
    setAddressState(getContractAddress());
  }, []);

  const setAddress = useCallback((value: string) => {
    try {
      window.localStorage.setItem(ADDRESS_STORAGE_KEY, value.trim());
    } catch {
      // keep going; the address still applies for this visit
    }
    setAddressState(value.trim());
  }, []);

  return { address, setAddress };
}

export function useFixProofContract(): FixProof | null {
  const { address: wallet } = useWallet();
  const { address } = useContractAddress();
  return useMemo(() => (address ? new FixProof(address, wallet) : null), [address, wallet]);
}

export function useBoard() {
  const contract = useFixProofContract();
  const { address } = useContractAddress();
  return useQuery<Board, Error>({
    queryKey: ["board", address],
    queryFn: () => (contract ? contract.getBoard() : Promise.resolve({ bounties: [], claims: {} })),
    enabled: !!contract,
    staleTime: 2000,
    refetchOnWindowFocus: true,
  });
}

export function useConfig() {
  const contract = useFixProofContract();
  const { address } = useContractAddress();
  return useQuery<Config, Error>({
    queryKey: ["config", address],
    queryFn: () => (contract ? contract.getConfig() : Promise.reject(new Error("No contract"))),
    enabled: !!contract,
    staleTime: 15000,
  });
}

export function useInvalidateBoard() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["board"] });
    queryClient.invalidateQueries({ queryKey: ["config"] });
  }, [queryClient]);
}

/** Seconds since 1970, refreshed so countdowns stay current. */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
