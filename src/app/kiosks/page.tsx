import { KioskStatusGrid } from "@/components/KioskStatusGrid";

export const metadata = {
  title: "IRL Network · Crypto Sharks",
};

export default function KiosksPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-4xl tracking-tight text-cyan-100">
          IRL Kiosk Network
        </h1>
        <p className="text-cyan-100/60 max-w-2xl">
          Live operational telemetry from the physical lottery-kiosk fleet that
          backs the staking pool. 20% of net 90-day profits route directly into
          the on-chain vault for qualified stakers.
        </p>
        <p className="text-xs text-cyan-100/40">
          ⓘ This dashboard currently consumes a mock feed at <code>/api/kiosks</code>. Replace with your operations backend.
        </p>
      </div>

      <KioskStatusGrid />
    </div>
  );
}
