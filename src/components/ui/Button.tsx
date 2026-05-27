import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-400 text-navy-900 hover:bg-cyan-300 shadow-glow hover:shadow-glow-lg disabled:bg-cyan-400/40 disabled:text-navy-900/60 disabled:shadow-none",
  secondary:
    "bg-teal-500/80 text-cyan-50 hover:bg-teal-400 ring-1 ring-cyan-400/30 disabled:bg-teal-500/30",
  ghost:
    "bg-transparent text-cyan-100 hover:bg-cyan-400/10 disabled:text-cyan-100/40",
  outline:
    "bg-transparent text-cyan-200 ring-1 ring-cyan-400/40 hover:bg-cyan-400/10 hover:ring-cyan-400/60 disabled:opacity-50",
  danger:
    "bg-rose-500/90 text-white hover:bg-rose-500 disabled:bg-rose-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
        "disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
        variants[variant],
        sizes[size],
        className
      )}
    />
  )
);
Button.displayName = "Button";
