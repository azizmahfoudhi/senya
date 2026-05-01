"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Sprout,
  Wallet,
  Layers,
  LineChart,
} from "lucide-react";

const nav = [
  { href: "/", label: "Résumé", icon: BarChart3 },
  { href: "/structure", label: "Structure", icon: Sprout },
  { href: "/lots", label: "Lots", icon: Layers },
  { href: "/depenses", label: "Dépenses", icon: Wallet },
  { href: "/projections", label: "Projections", icon: LineChart },
];

export function AppShell({
  title,
  children,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted font-semibold">Senya</div>
            <div className="truncate text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {title ?? "Tableau de bord"}
            </div>
          </div>
          <div className="shrink-0">{actions}</div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 pb-safe">
        <div className="mx-auto w-full max-w-4xl px-2 py-2 grid grid-cols-5 gap-1">
          {nav.map((i) => (
            <NavItem key={i.href} {...i} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-all duration-300",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted hover:bg-muted/10 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
      <span className="leading-none">{label}</span>
    </Link>
  );
}

