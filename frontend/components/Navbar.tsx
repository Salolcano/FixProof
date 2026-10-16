"use client";

import { useWallet } from "@/lib/genlayer/wallet";
import { shortAddress } from "@/lib/utils";

export function Navbar() {
  const { isConnected, address, isLoading, connectWallet, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch {
      // connectWallet already explains the problem in a toast
    }
  };

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <a className="brand" href="#top" aria-label="FixProof home">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="#1c1b18" />
            <path d="M16 7l2.2 6.8L25 16l-6.8 2.2L16 25l-2.2-6.8L7 16l6.8-2.2z" fill="#e8452c" />
          </svg>
          FixProof
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#payouts">Payouts</a>
          <a href="#app">The app</a>
          <a href="#trust">Why trust it</a>
        </nav>
        <div className="nav-cta">
          {isConnected && address ? (
            <>
              <span className="who" title={address}>
                {shortAddress(address)}
              </span>
              <button className="btn small" type="button" onClick={disconnectWallet}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn small" type="button" onClick={handleConnect} disabled={isLoading}>
              {isLoading ? "Connecting…" : "Connect wallet"}
            </button>
          )}
          <a className="btn small solid" href="#app">
            Open the app
          </a>
        </div>
      </div>
    </header>
  );
}
