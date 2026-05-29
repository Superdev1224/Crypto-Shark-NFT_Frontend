import { MintCard } from "@/components/MintCard";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { TIERS } from "@/lib/contracts";
import { usdCentsToUsd } from "@/lib/format";

export const metadata = {
  title: "Mint · Crypto Sharks",
};

export default function MintPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="text-center mb-10 space-y-3">
        <h1 className="font-display text-4xl tracking-tight text-cyan-100">
          Claim Your <span className="shimmer-text">Crypto Shark</span>
        </h1>
        <p className="text-cyan-100/60 max-w-2xl mx-auto">
          1,000 utility NFTs in four tiers. Pay in USDC. Once minted, stake your
          shark for 90 days to unlock pro-rata distribution cycle rewards.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-4">
          <h2 className="font-display text-xl tracking-wider text-cyan-100 mb-2">
            Tiered Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIERS.map((t) => (
              <Card key={t.label}>
                <div className="flex items-baseline justify-between mb-1">
                  <CardTitle>{t.label}</CardTitle>
                  <div className="font-display text-2xl text-cyan-200">
                    ${usdCentsToUsd(t.priceCents)}
                  </div>
                </div>
                <CardSubtitle>
                  Tokens #{t.range[0]}–#{t.range[1]}
                </CardSubtitle>
              </Card>
            ))}
          </div>

          <div className="rounded-2xl glass p-5 text-sm text-cyan-100/70 leading-relaxed">
            <p className="font-display text-cyan-200 mb-1 tracking-wider">
              Mechanics
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Mint price is set by the global mint index — tier rolls forward
                automatically as more sharks are minted.
              </li>
              <li>
                Multi-quantity mints purchase the next N consecutive token IDs at
                their respective tier prices.
              </li>
              <li>
                Approve USDC once for the exact amount, then mint. ERC-721A makes
                batch mints gas-efficient.
              </li>
            </ul>
          </div>
        </div>

        <MintCard />
      </div>
    </div>
  );
}
