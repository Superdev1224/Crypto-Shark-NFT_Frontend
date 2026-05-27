import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, hint, icon, className }: StatProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass p-5 flex flex-col gap-2 hover:ring-1 hover:ring-cyan-400/30 transition-shadow",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-100/60">
        {icon && <span className="text-cyan-300">{icon}</span>}
        {label}
      </div>
      <div className="font-display text-3xl text-cyan-100 text-glow">{value}</div>
      {hint && <div className="text-xs text-cyan-100/50">{hint}</div>}
    </div>
  );
}
