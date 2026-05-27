import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn(
        "rounded-2xl glass shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] p-6",
        className
      )}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-start justify-between gap-4 mb-4", className)} {...props} />
);

export const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "font-display text-lg tracking-wider text-cyan-100 uppercase",
      className
    )}
    {...props}
  />
);

export const CardSubtitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-cyan-100/60 mt-1", className)} {...props} />
);
