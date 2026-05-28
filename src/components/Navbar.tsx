"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useIsContractOwner } from "@/hooks/useIsContractOwner";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/mint", label: "Mint" },
  { href: "/stake", label: "Stake" },
] as const;

export function Navbar() {
  const path = usePathname();
  const { isAnyOwner } = useIsContractOwner();

  const links = isAnyOwner ? [...NAV, { href: "/admin", label: "Admin" }] : [...NAV];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-navy-900/40 border-b border-cyan-400/10">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="relative h-16 w-16 shrink-0">
            <Image
              src="/logo.png"
              alt="Crypto Sharks"
              fill
              sizes="84px"
              className="object-contain"
            />
          </span>
          <span className="font-display text-lg tracking-widest text-cyan-100 group-hover:text-cyan-300 transition-colors">
            CRYPTO SHARKS
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-wrap justify-end">
          {links.map((item) => {
            const active =
              path === item.href || (item.href !== "/" && path?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-cyan-200 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                    : "text-cyan-100/70 hover:text-cyan-100 hover:bg-cyan-400/5",
                  item.href === "/admin" &&
                  !active &&
                  "text-amber-200/90 ring-1 ring-amber-400/20 hover:ring-amber-400/40"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
