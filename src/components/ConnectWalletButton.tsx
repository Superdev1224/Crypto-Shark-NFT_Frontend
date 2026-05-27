"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { AlertTriangle, Check, ChevronDown, Copy, LogOut } from "lucide-react";
import { useConnectModal } from "./WalletModal";
import { Button } from "./ui/Button";
import { CHAIN_ID } from "@/lib/contracts";
import { cn } from "@/lib/utils";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type Props = {
  className?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
};

export function ConnectWalletButton({ className, fullWidth, size = "md" }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!isConnected || !address) {
    return (
      <Button
        onClick={openConnectModal}
        size={size}
        className={cn(fullWidth && "w-full", className)}
      >
        Connect Wallet
      </Button>
    );
  }

  const wrongChain = chainId !== CHAIN_ID;
  if (wrongChain) {
    return (
      <Button
        variant="danger"
        size={size}
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        disabled={switching}
        className={cn(fullWidth && "w-full", className)}
      >
        <AlertTriangle className="h-4 w-4" />
        {switching ? "Switching…" : "Switch Network"}
      </Button>
    );
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("relative", fullWidth && "w-full", className)} ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 px-3 h-10 rounded-xl",
          "bg-navy-700/70 ring-1 ring-cyan-400/30 hover:ring-cyan-400/60",
          "text-cyan-100 transition-all",
          fullWidth && "w-full justify-between"
        )}
      >
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-300 to-teal-500 ring-1 ring-cyan-400/40 shrink-0" />
        <span className="font-mono text-sm">{shorten(address)}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-cyan-100/60 transition-transform",
            menuOpen && "rotate-180"
          )}
        />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 glass-strong rounded-xl p-2 z-40 ring-1 ring-cyan-400/20 shadow-xl"
          role="menu"
        >
          <MenuButton
            icon={copied ? <Check className="h-4 w-4 text-cyan-300" /> : <Copy className="h-4 w-4" />}
            label={copied ? "Copied!" : "Copy Address"}
            onClick={copyAddress}
          />
          <MenuButton
            icon={<LogOut className="h-4 w-4" />}
            label="Disconnect"
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-cyan-100 hover:bg-cyan-400/10 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
