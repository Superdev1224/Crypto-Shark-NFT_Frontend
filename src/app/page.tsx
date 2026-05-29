import Image from "next/image";
import Link from "next/link";
import { PoolStats } from "@/components/PoolStats";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Anchor, Clock, Coins, Network, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-cyan-400/10 ring-1 ring-cyan-400/30 text-xs text-cyan-200 tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              Web3 × IRL Yield Network
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
              <span className="text-cyan-100">Stake your shark.</span>
              <br />
              <span className="shimmer-text">Earn real-world USDC.</span>
            </h1>
            <p className="text-lg text-cyan-100/70 max-w-xl leading-relaxed">
              1,000 utility NFTs backed by a diversified portfolio of cash-flowing
              IRL business. 15% of every 90-day net profit cycle is
              deposited into the staking vault and split pro-rata among qualified
              sharks.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/mint">
                <Button size="lg">Mint a Shark</Button>
              </Link>
              <Link href="/stake">
                <Button size="lg" variant="outline">
                  Stake & Claim
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-cyan-500/15 blur-3xl rounded-full animate-pulse-glow" />
            <div className="relative aspect-[1200/630] overflow-hidden rounded-2xl ring-1 ring-cyan-400/25 shadow-glow-lg animate-float-slow">
              <Image
                src="/og-image.png"
                alt="Crypto Sharks hero artwork"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pool stats */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-wider text-cyan-100">
              Live Pool Metrics
            </h2>
            <p className="text-sm text-cyan-100/60">
              Read directly from the staking vault on-chain.
            </p>
          </div>
        </div>
        <PoolStats />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="font-display text-2xl tracking-wider text-cyan-100 mb-6">
          How the Yield Engine Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="h-10 w-10 rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30 grid place-items-center mb-3">
              <Anchor className="h-5 w-5 text-cyan-300" />
            </div>
            <CardTitle>1 · Mint</CardTitle>
            <CardSubtitle>
              Pay in USDC at one of four tier prices ($250 → $1,000). ERC-721A
              keeps batch-mint gas linear.
            </CardSubtitle>
          </Card>
          <Card>
            <div className="h-10 w-10 rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30 grid place-items-center mb-3">
              <Clock className="h-5 w-5 text-cyan-300" />
            </div>
            <CardTitle>2 · Stake 90 Days</CardTitle>
            <CardSubtitle>
              Lock your NFT in the vault. Once it crosses the 90-day threshold,
              it's flagged Qualified at the next reward period snapshot.
            </CardSubtitle>
          </Card>
          <Card>
            <div className="h-10 w-10 rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30 grid place-items-center mb-3">
              <Coins className="h-5 w-5 text-cyan-300" />
            </div>
            <CardTitle>3 · Claim USDC</CardTitle>
            <CardSubtitle>
              The pool is split equally per qualified tokenId. One-click claim
              sends your share straight to your wallet.
            </CardSubtitle>
          </Card>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Network className="h-5 w-5 text-cyan-300 mb-3" />
            <CardTitle>IRL-Anchored</CardTitle>
            <CardSubtitle>
              Funded by a portfolio of regulated real-world operations — not
              speculative emissions or recursive yield.
            </CardSubtitle>
          </Card>
          <Card>
            <ShieldCheck className="h-5 w-5 text-cyan-300 mb-3" />
            <CardTitle>Auditable On-Chain</CardTitle>
            <CardSubtitle>
              Vault balance, qualifying count, and per-tokenId reward are all
              fully transparent. Claims are tracked by tokenId, not wallet.
            </CardSubtitle>
          </Card>
          <Card>
            <Anchor className="h-5 w-5 text-cyan-300 mb-3" />
            <CardTitle>NFT-Gated Utility</CardTitle>
            <CardSubtitle>
              Each shark also unlocks the Crypto Sharks NFT-poker network and
              DAO voting on tournament & ecosystem decisions.
            </CardSubtitle>
          </Card>
        </div>
      </section>
    </div>
  );
}
