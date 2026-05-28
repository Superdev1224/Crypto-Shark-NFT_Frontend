"use client";

import { useEffect, useState } from "react";
import { Activity, Radio, Wifi, WifiOff } from "lucide-react";
import { Stat } from "./ui/Stat";
import { Badge } from "./ui/Badge";

interface KioskFeed {
  updatedAt: string;
  totals: { dailyRevenueUsd: number; online: number; degraded: number; offline: number };
  projectedEpochPoolUsd: number;
  kiosks: {
    id: string;
    city: string;
    status: "online" | "degraded" | "offline";
    uptimePct: number;
    dailyRevenueUsd: number;
    lastPing: string;
  }[];
}

export function KioskStatusGrid() {
  const [data, setData] = useState<KioskFeed | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/kiosks");
        const json = (await res.json()) as KioskFeed;
        if (!cancelled) setData(json);
      } catch {
        /* swallow */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-cyan-100/60">
        Loading kiosk network telemetry…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Daily Gross"
          icon={<Activity className="h-4 w-4" />}
          value={`$${data.totals.dailyRevenueUsd.toLocaleString()}`}
          hint="Sum across all kiosks (24h)"
        />
        <Stat
          label="Online"
          icon={<Wifi className="h-4 w-4" />}
          value={`${data.totals.online} / ${data.kiosks.length}`}
          hint={`${data.totals.degraded} degraded · ${data.totals.offline} offline`}
        />
        <Stat
          label="Projected Epoch Pool"
          icon={<Radio className="h-4 w-4" />}
          value={`$${data.projectedEpochPoolUsd.toLocaleString()}`}
          hint="15% of 90-day net (estimate)"
        />
        <Stat
          label="Feed Updated"
          icon={<Activity className="h-4 w-4" />}
          value={new Date(data.updatedAt).toLocaleTimeString()}
          hint="Refreshes every 30s"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.kiosks.map((k) => (
          <div
            key={k.id}
            className="glass rounded-2xl p-5 flex flex-col gap-3 hover:ring-1 hover:ring-cyan-400/30 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg text-cyan-100">{k.id}</div>
                <div className="text-xs text-cyan-100/50">{k.city}</div>
              </div>
              {k.status === "online" && (
                <Badge tone="cyan">
                  <Wifi className="h-3 w-3" /> Online
                </Badge>
              )}
              {k.status === "degraded" && (
                <Badge tone="amber">
                  <Activity className="h-3 w-3" /> Degraded
                </Badge>
              )}
              {k.status === "offline" && (
                <Badge tone="rose">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-100/50">
                  Uptime
                </div>
                <div className="font-display text-cyan-100">{k.uptimePct.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-100/50">
                  Daily Gross
                </div>
                <div className="font-display text-cyan-100">
                  ${k.dailyRevenueUsd.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-cyan-100/40">
              Last ping {new Date(k.lastPing).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
