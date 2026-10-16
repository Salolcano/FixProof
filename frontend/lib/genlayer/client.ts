"use client";

import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN, GENLAYER_CHAIN_ID, GENLAYER_CHAIN_ID_HEX, GENLAYER_NETWORK } from "./network";

export { GENLAYER_CHAIN, GENLAYER_NETWORK, GENLAYER_CHAIN_ID } from "./network";

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const ADDRESS_STORAGE_KEY = "fixproof.contract";

/** The contract address from the build setting, or the one pasted into the app. */
export function getContractAddress(): string {
  const fromBuild = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "").trim();
  if (fromBuild) return fromBuild;
  if (typeof window === "undefined") return "";
  try {
    return (window.localStorage.getItem(ADDRESS_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function isWalletInstalled(): boolean {
  return getEthereumProvider() !== null;
}

export async function getAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) return [];
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch {
    return [];
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return await provider.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

export async function isOnGenLayerNetwork(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  return chainId !== null && parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
}

/** Switch the wallet to GenLayer, adding the network first if the wallet does not know it. */
export async function switchToGenLayerNetwork(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet found");
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GENLAYER_CHAIN_ID_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      await provider.request({ method: "wallet_addEthereumChain", params: [GENLAYER_NETWORK] });
    } else if (err?.code === 4001) {
      throw new Error("You declined switching the network");
    } else {
      throw new Error(`Could not switch network: ${err?.message ?? err}`);
    }
  }
}

/** Ask the wallet for an account and make sure it is on GenLayer. Returns the address. */
export async function connectWalletAccount(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet found");
  let accounts: string[];
  try {
    accounts = await provider.request({ method: "eth_requestAccounts" });
  } catch (err: any) {
    if (err?.code === 4001) throw new Error("You declined the connection request");
    throw new Error(`Could not connect: ${err?.message ?? err}`);
  }
  if (!accounts || accounts.length === 0) throw new Error("No accounts found");
  if (!(await isOnGenLayerNetwork())) await switchToGenLayerNetwork();
  return accounts[0];
}

/** Let the person pick another account in the wallet. */
export async function pickAnotherAccount(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet found");
  await provider.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
  const accounts: string[] = await provider.request({ method: "eth_accounts" });
  if (!accounts || accounts.length === 0) throw new Error("No account selected");
  return accounts[0];
}

/** A genlayer-js client for reads. Pass an address when one is connected. */
export function createGenLayerClient(address?: string | null) {
  const config: any = { chain: GENLAYER_CHAIN };
  if (address) config.account = address as `0x${string}`;
  return createClient(config);
}
