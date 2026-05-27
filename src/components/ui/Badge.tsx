import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "cyan" | "teal" | "amber" | "rose" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  cyan: "bg-cyan-400/15 text-cyan-200 ring-cyan-400/30",
  teal: "bg-teal-500/15 text-teal-200 ring-teal-400/30",
  amber: "bg-amber-400/15 text-amber-200 ring-amber-400/30",
  rose: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  muted: "bg-cyan-100/5 text-cyan-100/70 ring-cyan-100/15",
};

export function Badge({ tone = "muted", className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
        tones[tone],
        className
      )}
    />
  );
}
