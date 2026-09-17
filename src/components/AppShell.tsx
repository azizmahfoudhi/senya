"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Layers,
  Wallet,
  TrendingUp,
  CloudRain,
  BrainCircuit,
  Bell,
  Settings,
  Leaf,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const nav = [
  { href: "/",             label: "Résumé",    icon: BarChart3 },
  { href: "/lots",         label: "Lots",       icon: Layers    },
  { href: "/depenses",     label: "Dépenses",   icon: Wallet    },
  { href: "/projections",  label: "Prévisions", icon: TrendingUp },
  { href: "/pluviometrie", label: "Météo",      icon: CloudRain },
];

const secondaryNav = [
  { href: "/memory",        label: "Mémoire",       icon: BrainCircuit },
  { href: "/notifications", label: "Alertes",        icon: Bell         },
  { href: "/structure",     label: "Configuration",  icon: Settings     },
];

export function AppShell({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-20 border-r border-border bg-card"
             style={{ width: "var(--sidebar-width, 220px)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">Senya</span>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <SidebarItem key={item.href} {...item} />
          ))}

          <div className="pt-4 pb-1 px-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Outils
            </span>
          </div>

          {secondaryNav.map((item) => (
            <SidebarItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="border-t border-border px-3 py-3 shrink-0">
          <button
            onClick={() => setTheme(theme === "dark" ? "day" : "dark")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted hover:text-foreground hover:bg-secondary transition-colors"
          >
            <span className="text-base">{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="font-medium">{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-[var(--sidebar-width,220px)]">
        {/* Mobile / page header */}
        <header className="sticky top-0 z-10 lg:hidden border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm text-foreground">Senya</span>
              {title && (
                <span className="text-muted text-sm">/ {title}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {actions}
            </div>
          </div>
        </header>

        {/* Desktop page header */}
        <header className="hidden lg:flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {title && (
              <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-5 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {nav.map((item) => (
            <MobileNavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function SidebarItem({
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
        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted hover:text-foreground hover:bg-secondary"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted")} />
      <span>{label}</span>
      {active && (
        <span className="ml-auto w-1 h-4 rounded-full bg-primary shrink-0" />
      )}
    </Link>
  );
}

function MobileNavItem({
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
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors",
        active ? "text-primary" : "text-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", active && "text-primary")} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}
