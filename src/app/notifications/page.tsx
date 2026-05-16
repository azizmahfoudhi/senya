"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useFarmData } from "@/lib/useFarmData";
import { useWeather } from "@/lib/useWeather";
import { buildInsights } from "@/lib/derive";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Bell, BellOff } from "lucide-react";

export default function NotificationsPage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading } = useWeather();

  const state = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  const insights = buildInsights(state, weather);

  if (farm.loading || weatherLoading) {
    return (
      <AppShell title="Notifications">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Chargement des alertes...
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Notifications">
      <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {insights.length} {insights.length > 1 ? "alertes actives" : "alerte active"}
          </p>
        </div>
      </div>

      {insights.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-background/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-4 border border-border/40 shadow-inner">
              <BellOff className="w-8 h-8 text-muted/60" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Aucune notification</h2>
            <p className="text-muted-foreground max-w-sm">
              Votre exploitation ne présente actuellement aucune alerte critique ni recommandation d'action.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          {insights.map((i) => (
            <div
              key={i.id}
              className={cn(
                "rounded-2xl border p-5 transition-all flex flex-col sm:flex-row gap-5 items-start hover:-translate-y-0.5 hover:shadow-lg",
                i.level === "danger"
                  ? "border-danger/30 bg-danger/5 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-danger/20"
                  : i.level === "warning"
                    ? "border-warning/40 bg-warning/5 hover:shadow-warning/20"
                    : i.level === "success"
                      ? "border-primary/40 bg-primary/10 hover:shadow-primary/20"
                      : "border-primary/20 bg-primary/5 hover:shadow-primary/10"
              )}
            >
              <div className="text-4xl shrink-0 p-3 bg-background/60 rounded-xl border border-border/40 shadow-sm backdrop-blur-md">
                {i.icon}
              </div>
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className={cn(
                    "text-xl font-black tracking-tight",
                    i.level === "danger" ? "text-danger" : i.level === "warning" ? "text-warning-foreground" : "text-primary"
                  )}>
                    {i.titre}
                  </div>
                  {i.level === "danger" && (
                    <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider border border-danger/20">
                      Critique
                    </span>
                  )}
                  {i.level === "warning" && (
                    <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning-foreground text-[10px] font-bold uppercase tracking-wider border border-warning/20">
                      Attention
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-bold text-foreground/80 uppercase text-[10px] tracking-widest">Le Constat</span>
                    <div className="text-foreground/90 mt-1 font-medium leading-relaxed">{i.whatIsHappening}</div>
                  </div>
                  <div className="bg-background/50 p-3 rounded-xl border border-border/40 shadow-inner">
                    <span className="font-bold text-foreground/80 uppercase text-[10px] tracking-widest flex items-center gap-1.5 mb-1.5">
                      🎯 Action Recommandée
                    </span>
                    <div className="text-foreground font-semibold leading-relaxed">{i.whatToDo}</div>
                  </div>
                  <div>
                    <span className="font-bold text-foreground/80 uppercase text-[10px] tracking-widest">L'Impact</span>
                    <div className="text-muted-foreground mt-1 italic text-xs leading-relaxed">{i.whyItMatters}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
