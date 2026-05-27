import { StakeDashboard } from "@/components/StakeDashboard";
import { PoolStats } from "@/components/PoolStats";

export const metadata = {
  title: "Stake · Crypto Sharks",
};

export default function StakePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <div className="space-y-3">
        <h1 className="font-display text-4xl tracking-tight text-cyan-100">
          Staking Command Center
        </h1>
        <p className="text-cyan-100/60 max-w-2xl">
          Stake your sharks, watch every 90-day clock in real time, and claim
          USDC dividends in a single click.
        </p>
      </div>

      <PoolStats />
      <StakeDashboard />
    </div>
  );
}
