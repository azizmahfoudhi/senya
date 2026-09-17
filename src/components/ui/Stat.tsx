import * as React from "react";
import { cn } from "@/lib/cn";

interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function Stat({ label, value, sub, icon, className }: StatProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        "flex flex-col gap-1",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted font-medium uppercase tracking-wide">
        <span>{label}</span>
        {icon && <span className="text-muted opacity-60">{icon}</span>}
      </div>
      <div className="text-xl font-bold text-foreground tabular-nums leading-none mt-0.5">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-muted leading-none">{sub}</div>
      )}
    </div>
  );
}
