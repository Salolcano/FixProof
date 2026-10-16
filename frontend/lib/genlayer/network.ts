import { studioDevnet } from "genlayer-js/chains";

// FixProof runs on GenLayer Studio. Everything about the network can be changed from
// Vercel's Environment Variables screen, so switching networks never needs a code change.
const DEFAULT_CHAIN_ID = "61999";
const DEFAULT_CHAIN_NAME = "GenLayer Studio";
const DEFAULT_RPC_URL = "https://studio.genlayer.com/api";
const DEFAULT_EXPLORER_URL = "https://explorer-studio.genlayer.com";

function parseChainId(value: string | undefined): number {
  const text = value && value.trim() !== "" ? value.trim() : DEFAULT_CHAIN_ID;
  const chainId = Number(text);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error(`NEXT_PUBLIC_GENLAYER_CHAIN_ID must be a positive integer; received ${text}`);
  }
  return chainId;
}

const chainId = parseChainId(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID);
const chainName = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || DEFAULT_CHAIN_NAME;
const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || DEFAULT_RPC_URL;
const symbol = process.env.NEXT_PUBLIC_GENLAYER_SYMBOL || "GEN";

export const GENLAYER_EXPLORER_URL = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL || DEFAULT_EXPLORER_URL;

// One chain object shared by the wallet, genlayer-js and Transaction Kit, so an RPC
// override can never produce a transaction signed for a different chain.
export const GENLAYER_CHAIN = {
  ...studioDevnet,
  id: chainId,
  name: chainName,
  nativeCurrency: { name: symbol, symbol, decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
} satisfies typeof studioDevnet;

export const GENLAYER_CHAIN_ID = chainId;
export const GENLAYER_CHAIN_ID_HEX = `0x${chainId.toString(16)}`;

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName,
  nativeCurrency: GENLAYER_CHAIN.nativeCurrency,
  rpcUrls: [rpcUrl],
  blockExplorerUrls: [GENLAYER_EXPLORER_URL],
};
