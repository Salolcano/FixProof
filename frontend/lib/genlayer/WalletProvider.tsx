"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  connectWalletAccount,
  getAccounts,
  getCurrentChainId,
  getEthereumProvider,
  isOnGenLayerNetwork,
  isWalletInstalled,
  pickAnotherAccount,
  GENLAYER_CHAIN_ID,
} from "./client";
import { error, info } from "../utils/toast";

const DISCONNECTED_KEY = "fixproof.disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isWalletInstalled: boolean;
  isOnCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const EMPTY: WalletState = {
  address: null,
  chainId: null,
  isConnected: false,
  isLoading: true,
  isWalletInstalled: false,
  isOnCorrectNetwork: false,
};

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(DISCONNECTED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) window.localStorage.setItem(DISCONNECTED_KEY, "true");
    else window.localStorage.removeItem(DISCONNECTED_KEY);
  } catch {
    // storage can be unavailable; the wallet state still works for this visit
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(EMPTY);

  // Pick up an existing wallet session on load, unless the person chose to disconnect.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const installed = isWalletInstalled();
      if (!installed || readFlag()) {
        if (!cancelled) setState({ ...EMPTY, isLoading: false, isWalletInstalled: installed });
        return;
      }
      const [accounts, chainId, onNetwork] = await Promise.all([
        getAccounts(),
        getCurrentChainId(),
        isOnGenLayerNetwork(),
      ]);
      if (cancelled) return;
      setState({
        address: accounts[0] ?? null,
        chainId,
        isConnected: accounts.length > 0,
        isLoading: false,
        isWalletInstalled: true,
        isOnCorrectNetwork: onNetwork,
      });
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow account and network changes made inside the wallet.
  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const onAccounts = async (accounts: string[]) => {
      if (accounts.length > 0) writeFlag(false);
      const [chainId, onNetwork] = await Promise.all([getCurrentChainId(), isOnGenLayerNetwork()]);
      setState((prev) => ({
        ...prev,
        address: accounts[0] ?? null,
        chainId,
        isConnected: accounts.length > 0,
        isOnCorrectNetwork: onNetwork,
      }));
    };
    const onChain = async (chainId: string) => {
      const accounts = await getAccounts();
      setState((prev) => ({
        ...prev,
        chainId,
        address: accounts[0] ?? null,
        isConnected: accounts.length > 0,
        isOnCorrectNetwork: parseInt(chainId, 16) === GENLAYER_CHAIN_ID,
      }));
    };

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener("accountsChanged", onAccounts);
      provider.removeListener("chainChanged", onChain);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const address = await connectWalletAccount();
      const [chainId, onNetwork] = await Promise.all([getCurrentChainId(), isOnGenLayerNetwork()]);
      writeFlag(false);
      setState({
        address,
        chainId,
        isConnected: true,
        isLoading: false,
        isWalletInstalled: true,
        isOnCorrectNetwork: onNetwork,
      });
      return address;
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const message = String(err?.message ?? err);
      if (/declined/i.test(message)) info("Connection cancelled");
      else if (/No wallet/i.test(message)) error("No wallet found", { description: "Install MetaMask, then reload this page." });
      else error("Could not connect the wallet", { description: message });
      throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    writeFlag(true);
    setState((prev) => ({ ...prev, address: null, isConnected: false }));
  }, []);

  const switchWalletAccount = useCallback(async () => {
    try {
      const address = await pickAnotherAccount();
      const [chainId, onNetwork] = await Promise.all([getCurrentChainId(), isOnGenLayerNetwork()]);
      writeFlag(false);
      setState((prev) => ({ ...prev, address, chainId, isConnected: true, isOnCorrectNetwork: onNetwork }));
      return address;
    } catch (err: any) {
      error("Could not switch account", { description: String(err?.message ?? err) });
      throw err;
    }
  }, []);

  const value: WalletContextValue = { ...state, connectWallet, disconnectWallet, switchWalletAccount };
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
