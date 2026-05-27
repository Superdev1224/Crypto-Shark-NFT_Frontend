"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useAccount, useConnect, type Connector } from "wagmi";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type WalletModalCtx = {
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isOpen: boolean;
};

const WalletModalContext = createContext<WalletModalCtx | null>(null);

export function useConnectModal(): WalletModalCtx {
  const ctx = useContext(WalletModalContext);
  if (!ctx) {
    throw new Error("useConnectModal must be used inside <WalletModalProvider>");
  }
  return ctx;
}

export function WalletModalProvider({ children }: PropsWithChildren) {
  const [isOpen, setOpen] = useState(false);
  const { isConnected } = useAccount();

  const openConnectModal = useCallback(() => setOpen(true), []);
  const closeConnectModal = useCallback(() => setOpen(false), []);

  // Auto-close once a connection is established.
  useEffect(() => {
    if (isConnected && isOpen) setOpen(false);
  }, [isConnected, isOpen]);

  const value = useMemo(
    () => ({ openConnectModal, closeConnectModal, isOpen }),
    [openConnectModal, closeConnectModal, isOpen]
  );

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      <ConnectModal open={isOpen} onClose={closeConnectModal} />
    </WalletModalContext.Provider>
  );
}

function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectors, connect, isPending, variables, error, reset } = useConnect();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset any previous connect errors whenever the modal is reopened.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  if (!open) return null;

  // Deduplicate by connector id so EIP-6963 discoveries don't double up with the
  // generic "injected" fallback when they refer to the same wallet.
  const seen = new Set<string>();
  const list: Connector[] = [];
  for (const c of connectors) {
    const key = c.id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(c);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect a wallet"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-md" />
      <div
        className="relative glass-strong rounded-2xl w-full max-w-sm p-6 shadow-2xl ring-1 ring-cyan-400/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg tracking-wider text-cyan-100">
            Connect a wallet
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyan-100/60 hover:text-cyan-100 hover:bg-cyan-400/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-2">
          {list.map((connector) => {
            const pending = isPending && variables?.connector === connector;
            return (
              <li key={connector.uid}>
                <button
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl",
                    "bg-navy-700/60 hover:bg-cyan-400/10 ring-1 ring-cyan-400/15 hover:ring-cyan-400/40",
                    "transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <ConnectorIcon connector={connector} />
                    <span className="font-medium text-cyan-100 truncate">
                      {prettyName(connector)}
                    </span>
                  </span>
                  {pending && (
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-300 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {error && (
          <p className="mt-4 text-sm text-rose-300/90 break-words">
            {error.message}
          </p>
        )}

        <p className="mt-5 text-xs text-cyan-100/40 text-center">
          By connecting, you agree to interact with the Crypto Sharks contracts.
        </p>
      </div>
    </div>
  );
}

function ConnectorIcon({ connector }: { connector: Connector }) {
  const icon = (connector as { icon?: string }).icon;
  if (icon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" className="h-7 w-7 rounded-md object-cover" />;
  }
  return (
    <span className="h-7 w-7 rounded-md bg-cyan-400/15 ring-1 ring-cyan-400/30 grid place-items-center text-xs font-bold text-cyan-200">
      {prettyName(connector).slice(0, 1).toUpperCase()}
    </span>
  );
}

function prettyName(connector: Connector) {
  if (connector.id === "injected") return "Browser Wallet";
  if (connector.id === "walletConnect") return "WalletConnect";
  return connector.name;
}
