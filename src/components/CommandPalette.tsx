"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Map as MapIcon, Wallet, TrendingUp, Home, CloudRain, X, Command } from "lucide-react";
import { useFarmData } from "@/lib/useFarmData";
import { cn } from "@/lib/cn";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const farm = useFarmData();

  const pages = [
    { name: "Tableau de Bord", href: "/", icon: Home, category: "Navigation" },
    { name: "Pluviométrie & Météo", href: "/pluviometrie", icon: CloudRain, category: "Navigation" },
    { name: "Gestion des Lots", href: "/lots", icon: MapIcon, category: "Navigation" },
    { name: "Dépenses & Finances", href: "/depenses", icon: Wallet, category: "Navigation" },
    { name: "Prévisions & IA", href: "/projections", icon: TrendingUp, category: "Navigation" },
  ];

  const lots = farm.lots.map(l => ({
    name: l.nom,
    href: `/lots/${l.id}`,
    icon: MapIcon,
    category: "Parcelles",
  }));

  const items = [...pages, ...lots].filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const onSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) onSelect(items[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-background/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setOpen(false)} />
      
      <div 
        className="w-full max-w-xl glass-card rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 relative z-10 border-primary/20"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-6 py-4 border-b border-border/40 gap-3">
          <Search className="w-5 h-5 text-primary animate-pulse" />
          <input
            autoFocus
            placeholder="Rechercher une parcelle, une page..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg outline-none placeholder:text-muted"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/10 border border-border/20 text-[10px] font-bold text-muted">
            <Command className="w-3 h-3" /> K
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="grid gap-1">
              {items.map((item, index) => (
                <button
                  key={`${item.category}-${item.name}`}
                  onClick={() => onSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group text-left",
                    index === selectedIndex ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] z-10" : "hover:bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      index === selectedIndex ? "bg-white/20" : "bg-primary/10 text-primary"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className={cn(
                        "text-[10px] uppercase tracking-widest font-bold opacity-60",
                        index === selectedIndex ? "text-white" : "text-muted"
                      )}>
                        {item.category}
                      </div>
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-md">ENTRÉE</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 border-t border-border/40 bg-muted/5 flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="p-0.5 rounded border border-border/40 bg-background">↑↓</span> Naviguer</span>
            <span className="flex items-center gap-1"><span className="p-0.5 rounded border border-border/40 bg-background">↩</span> Sélectionner</span>
          </div>
          <span>Assistant Senya</span>
        </div>
      </div>
    </div>
  );
}
