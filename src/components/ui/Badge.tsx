import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted" | "primary";

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-secondary text-secondary-foreground",
  primary:  "bg-primary/10 text-primary border border-primary/20",
  success:  "bg-success/10 text-success border border-success/20",
  warning:  "bg-warning/10 text-warning border border-warning/20",
  danger:   "bg-danger/10 text-danger border border-danger/20",
  muted:    "bg-muted/10 text-muted border border-border",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
        "text-[10px] font-semibold uppercase tracking-wide leading-none",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
