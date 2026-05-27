"use client";

import { useEffect, useState } from "react";
import { splitCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  /** Unix seconds at which countdown reaches zero */
  targetUnix: number;
  className?: string;
  compact?: boolean;
}

export function CountdownTimer({ targetUnix, className, compact }: Props) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, targetUnix - now);
  const parts = splitCountdown(remaining);

  if (parts.isReady) {
    return (
      <span className={cn("text-cyan-300 font-display text-sm tracking-widest text-glow", className)}>
        READY
      </span>
    );
  }

  if (compact) {
    return (
      <span className={cn("font-mono text-cyan-200", className)}>
        {parts.days}d {parts.hours.toString().padStart(2, "0")}h{" "}
        {parts.minutes.toString().padStart(2, "0")}m
      </span>
    );
  }

  return (
    <div className={cn("flex items-end gap-2", className)}>
      <Cell value={parts.days} unit="DAYS" />
      <Sep />
      <Cell value={parts.hours} unit="HRS" />
      <Sep />
      <Cell value={parts.minutes} unit="MIN" />
      <Sep />
      <Cell value={parts.seconds} unit="SEC" />
    </div>
  );
}

function Cell({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.5rem]">
      <div className="font-display text-2xl text-cyan-100 text-glow tabular-nums">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-[10px] tracking-widest text-cyan-100/50">{unit}</div>
    </div>
  );
}

function Sep() {
  return <div className="font-display text-2xl text-cyan-400/40 -mt-3">:</div>;
}
