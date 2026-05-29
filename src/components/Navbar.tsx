"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useIsContractOwner } from "@/hooks/useIsContractOwner";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/mint", label: "Mint" },
  { href: "/stake", label: "Stake" },
] as const;

type NavItem = { href: string; label: string };

function isActive(path: string | null, href: string) {
  return path === href || (href !== "/" && !!path?.startsWith(href));
}

function NavLinks({
  links,
  path,
  className,
  linkClassName,
  onNavigate,
}: {
  links: NavItem[];
  path: string | null;
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className}>
      {links.map((item) => {
        const active = isActive(path, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "text-cyan-200 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                : "text-cyan-100/70 hover:text-cyan-100 hover:bg-cyan-400/5",
              item.href === "/admin" &&
                !active &&
                "text-amber-200/90 ring-1 ring-amber-400/20 hover:ring-amber-400/40",
              linkClassName
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavMenu({ links, path }: { links: NavItem[]; path: string | null }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeLabel = links.find((item) => isActive(path, item.href))?.label ?? "Menu";

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open navigation menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          "bg-navy-700/70 ring-1 ring-cyan-400/30 hover:ring-cyan-400/60",
          "text-cyan-100 transition-all",
          open && "ring-cyan-400/60 bg-cyan-400/10"
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 glass-strong rounded-xl p-2 z-50 ring-1 ring-cyan-400/20 shadow-xl"
          role="menu"
        >
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyan-100/50">
            {activeLabel}
          </p>
          {links.map((item) => {
            const active = isActive(path, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-cyan-100 bg-cyan-400/15 ring-1 ring-cyan-400/30"
                    : "text-cyan-100/80 hover:bg-cyan-400/10 hover:text-cyan-100",
                  item.href === "/admin" &&
                    !active &&
                    "text-amber-200/90 hover:bg-amber-400/10"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const path = usePathname();
  const { isAnyOwner } = useIsContractOwner();

  const links: NavItem[] = isAnyOwner
    ? [...NAV, { href: "/admin", label: "Admin" }]
    : [...NAV];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-navy-900/40 border-b border-cyan-400/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <span className="relative h-12 w-12 sm:h-16 sm:w-16 shrink-0">
            <Image
              src="/logo.png"
              alt="Crypto Sharks"
              fill
              sizes="(max-width: 640px) 48px, 64px"
              className="object-contain"
            />
          </span>
          <span className="font-display text-base sm:text-lg tracking-widest text-cyan-100 group-hover:text-cyan-300 transition-colors truncate">
            CRYPTO SHARKS
          </span>
        </Link>

        <NavLinks
          links={links}
          path={path}
          className="hidden md:flex items-center gap-1 flex-wrap justify-end"
        />

        <div className="flex items-center gap-2 shrink-0">
          <MobileNavMenu links={links} path={path} />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
