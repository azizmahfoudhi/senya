"use client";

import { useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Sprout,
  Wallet,
  Layers,
  BrainCircuit,
  TrendingUp,
  CloudRain,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const nav = [
  { href: "/", label: "Résumé", icon: BarChart3 },
  { href: "/pluviometrie", label: "Météo", icon: CloudRain },
  { href: "/lots", label: "Lots", icon: Layers },
  { href: "/depenses", label: "Dépenses", icon: Wallet },
  { href: "/projections", label: "Prévisions", icon: TrendingUp },
];

import Image from "next/image";

export function AppShell({
  title,
  children,
  actions,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme, toggle } = useTheme();
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => console.log("SW registered:", registration))
        .catch((error) => console.log("SW registration failed:", error));
    }
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70 shadow-sm print:hidden">
        <div className="mx-auto w-full max-w-4xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/logo.png" alt="Senya Logo" width={36} height={36} className="bg-white rounded-xl shadow-sm border border-border/50" />
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent leading-none pb-0.5">
                Senya
              </h1>
              {title && (
                <div className="text-xs font-medium text-muted uppercase tracking-wider">
                  {title}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground transition-all duration-300 border border-border/20"
              aria-label="Changer de thème"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="shrink-0">{actions}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100 print:pb-0 print:py-0">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 pb-safe print:hidden">
        <div className="mx-auto w-full max-w-4xl px-2 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
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
        "group flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-all duration-300",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted hover:bg-muted/10 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
      <span className="leading-none whitespace-nowrap">{label}</span>
    </Link>
  );
}

