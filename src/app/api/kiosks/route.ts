import { NextResponse } from "next/server";

// Mock IRL kiosk network feed — replace with real backend integration
const KIOSK_LOCATIONS = [
  { id: "FL-MIA-01", city: "Miami, FL" },
  { id: "FL-ORL-04", city: "Orlando, FL" },
  { id: "TX-HOU-11", city: "Houston, TX" },
  { id: "TX-DAL-07", city: "Dallas, TX" },
  { id: "NV-LV-02", city: "Las Vegas, NV" },
  { id: "GA-ATL-09", city: "Atlanta, GA" },
  { id: "NJ-AC-05", city: "Atlantic City, NJ" },
  { id: "NY-NYC-13", city: "New York, NY" },
  { id: "CA-LA-06", city: "Los Angeles, CA" },
  { id: "AZ-PHX-03", city: "Phoenix, AZ" },
  { id: "IL-CHI-08", city: "Chicago, IL" },
  { id: "WA-SEA-10", city: "Seattle, WA" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  const seed = Math.floor(Date.now() / 60_000); // changes once per minute
  const rng = mulberry32(seed);

  const kiosks = KIOSK_LOCATIONS.map((k) => {
    const r = rng();
    const status: "online" | "degraded" | "offline" =
      r > 0.92 ? "offline" : r > 0.8 ? "degraded" : "online";
    const uptimePct = status === "online" ? 98 + rng() * 2 : status === "degraded" ? 85 + rng() * 10 : 0;
    const dailyRevenue = Math.round((150 + rng() * 850) * (status === "offline" ? 0 : 1));
    return {
      ...k,
      status,
      uptimePct: Number(uptimePct.toFixed(1)),
      dailyRevenueUsd: dailyRevenue,
      lastPing: new Date(Date.now() - Math.floor(rng() * 1000 * 60 * 30)).toISOString(),
    };
  });

  const totals = kiosks.reduce(
    (acc, k) => {
      acc.dailyRevenueUsd += k.dailyRevenueUsd;
      if (k.status === "online") acc.online++;
      else if (k.status === "degraded") acc.degraded++;
      else acc.offline++;
      return acc;
    },
    { dailyRevenueUsd: 0, online: 0, degraded: 0, offline: 0 }
  );

  // Per the White Paper: 20% of net IRL profits flow to the staking pool every 90 days.
  // We approximate "net" as 35% of gross daily revenue, then 20% routed to pool, x90.
  const projectedEpochPoolUsd = Math.round(
    totals.dailyRevenueUsd * 0.35 * 0.2 * 90
  );

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    totals,
    projectedEpochPoolUsd,
    kiosks,
  });
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
