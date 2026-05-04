"use client";

import * as React from "react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { buildInsights, farmTotals, expensesSeriesLast12Months } from "@/lib/derive";
import { useWeather } from "@/lib/useWeather";
import { computeGlobalHealth, computeLotHealth } from "@/lib/intelligence";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useFarmData } from "@/lib/useFarmData";
import { Sprout, Layers, Wallet, ArrowRight, TrendingUp, Settings, BrainCircuit, Sun, Cloud, Snowflake, CloudRain, Moon } from "lucide-react";
import { useHistoricalRain } from "@/lib/useHistoricalRain";

export default function HomePage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading, lastFetched } = useWeather();

  const state = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  const totals = farmTotals(state);
  const insights = buildInsights(state, weather);
  const expensesSeries = expensesSeriesLast12Months(state).map((p) => ({
    ...p,
    month: p.monthISO.slice(5, 7),
  }));
  
  const { projectedRainMm, loading: historyLoading } = useHistoricalRain();
  const globalHealth = computeGlobalHealth(state, projectedRainMm);

  if (farm.loading) {
    return (
      <AppShell title="Résumé">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="md:col-span-2 h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Résumé"
      actions={
        <Link href="/structure" className="p-2 rounded-full hover:bg-muted transition-colors flex items-center justify-center" title="Configuration de la Structure">
          <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
      }
    >
      {farm.error ? (
        <Card className="mb-4 border-danger/20 bg-danger/5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <div>
              <CardTitle className="text-danger">Connexion Supabase</CardTitle>
              <CardDescription className="text-danger/80">
                {farm.error}. Vérifiez `.env.local` + le schéma SQL.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <button
              className="text-sm font-medium text-danger hover:underline transition-all"
              onClick={() => farm.refresh()}
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      ) : null}

      {farm.lots.length === 0 ? (
        <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4 sm:mt-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Sprout className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-center">Bienvenue sur Senya</h2>
          <p className="text-muted text-center max-w-md mb-8">
            Votre exploitation est vide. Suivez ces trois étapes simples pour commencer à générer vos projections de rentabilité.
          </p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <Link href="/structure" className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold">Paramétrer la ferme</div>
                <div className="text-xs text-muted">Surface, prix de vente et types d'arbres.</div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
            </Link>

            <Link href="/lots" className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center text-muted shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors">Ajouter vos lots</div>
                <div className="text-xs text-muted">Combien d'arbres avez-vous plantés et quand ?</div>
              </div>
              <Layers className="w-5 h-5 text-muted/50 group-hover:text-primary transition-colors" />
            </Link>

            <Link href="/depenses" className="group flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center text-muted shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors">Saisir les dépenses</div>
                <div className="text-xs text-muted">Frais et investissements de la ferme.</div>
              </div>
              <Wallet className="w-5 h-5 text-muted/50 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* HERO SECTION */}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch mb-8 mt-2 px-2">
            <div className="flex-1 space-y-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 rounded-[2.5rem] border border-primary/20 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
              
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center gap-3">
                <span className="animate-float inline-block">👋</span> 
                Bonjour.
              </h2>
              <p className="text-muted-foreground font-medium text-xl pt-1">
                Oliveraie de {farm.settings.surfaceHa} ha <span className="text-sm opacity-50 font-normal">({farm.lots.length} parcelles)</span>
              </p>
              
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-3 bg-background/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-border/50 shadow-sm animate-pulse-glow">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Santé Moyenne</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-3 w-3 rounded-full animate-pulse",
                      globalHealth >= 80 ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : globalHealth >= 50 ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    )} />
                    <span className="font-black text-2xl tracking-tighter">{historyLoading ? "..." : globalHealth}<span className="text-sm opacity-40 font-bold">/100</span></span>
                  </div>
                </div>
                
                <Link href="/lots" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  Gérer les lots <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <MetricCard
              title="Arbres"
              value={formatNumber(totals.totalTrees)}
              sub={`${state.lots.length} lot(s)`}
              delay="delay-[100ms]"
            />
            <MetricCard
              title="Investissement"
              value={formatMoneyDT(totals.totalInvestment)}
              sub="Dépenses totales"
              delay="delay-[200ms]"
            />
            <MetricCard
              title="Dépenses / 12 mois"
              value={formatMoneyDT(totals.estimatedYearlyCosts)}
              sub="Dépenses totales"
              delay="delay-[300ms]"
            />
            <MetricCard
              title="Production annuelle"
              value={formatKg(totals.estimatedYearlyProductionKg)}
              sub="Estimée"
              delay="delay-[400ms]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
              <CardHeader>
                <div>
                  <CardTitle className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Rentabilité (estimation)
                  </CardTitle>
                  <CardDescription>
                    Recettes − dépenses 12 derniers mois
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="group/item rounded-2xl border border-border/40 bg-background/40 p-4 transition-all hover:bg-background/60 hover:border-primary/30">
                    <div className="text-xs text-muted font-medium uppercase tracking-wider">Recettes</div>
                    <div className="mt-2 text-2xl font-bold tracking-tight">
                      {formatMoneyDT(totals.estimatedRevenue)}
                    </div>
                    <div className="mt-1 text-xs text-muted flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/40 inline-block"></span>
                      Prix: {formatNumber(state.settings.prixKgOlives || 0, 2)} / kg
                    </div>
                  </div>
                  <div className="group/item rounded-2xl border border-border/40 bg-background/40 p-4 transition-all hover:bg-background/60 hover:border-primary/30">
                    <div className="text-xs text-muted font-medium uppercase tracking-wider">Résultat</div>
                    <div
                      className={cn(
                        "mt-2 text-2xl font-bold tracking-tight",
                        totals.profit >= 0 ? "text-primary" : "text-danger drop-shadow-sm",
                      )}
                    >
                      {formatMoneyDT(totals.profit)}
                    </div>
                    <div className="mt-1 text-xs text-muted flex items-center gap-1">
                      <span className={cn("w-2 h-2 rounded-full inline-block", totals.profit >= 0 ? "bg-primary/40" : "bg-danger/40")}></span>
                      Coût/kg: {formatNumber(totals.costPerKg || 0, 2)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 relative z-10">
                  <Link href="/projections" className="flex items-center justify-between group/link hover:bg-background/40 p-2 -mx-2 rounded-xl transition-all">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Voir les projections à long terme</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover/link:text-primary transition-colors transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
              <CardHeader>
                <div>
                  <CardTitle>Dépenses</CardTitle>
                  <CardDescription>Dépenses des 12 derniers mois</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-44 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expensesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'var(--muted)', fontSize: 12 }}
                        dy={10}
                      />
                      <Tooltip
                        cursor={{ stroke: 'var(--muted)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{
                          borderRadius: '16px',
                          border: "1px solid var(--border)",
                          background: "rgba(var(--card-rgb), 0.8)",
                          backdropFilter: "blur(12px)",
                          color: "var(--foreground)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          padding: '8px 12px'
                        }}
                        itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                        formatter={(v: unknown) => [formatMoneyDT(Number(v)), "Montant"]}
                        labelStyle={{ color: 'var(--muted)', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="montant"
                        stroke="var(--primary)"
                        fill="url(#colorMontant)"
                        strokeWidth={3}
                        activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 glass-card rounded-[2.5rem] shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 animate-scanning z-20 pointer-events-none" />
              
              <CardHeader className="pb-3 border-b border-border/40 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <span className="text-3xl animate-float">🤖</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent font-black tracking-tight">Intelligence Artificielle</CardTitle>
                      <CardDescription className="font-medium">
                        {weather ? `${weather.current.temp}°C · ${weather.current.isDay ? 'Ensoleillé' : 'Nuit'}` : "Calcul des variables..."}
                        {lastFetched && <span className="ml-2 text-[10px] opacity-70">Màj: {lastFetched}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/memory">
                      <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-border/50 bg-background/40 hover:bg-primary/5 hover:text-primary transition-all">
                        <BrainCircuit className="w-4 h-4" />
                        <span className="hidden sm:inline font-bold">Mémoire</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {insights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-background/30 rounded-2xl border border-dashed border-border">
                    <div className="text-sm font-medium">L'assistant collecte des données...</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {insights.map((i) => (
                      <div
                        key={i.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-all flex flex-col sm:flex-row gap-4 items-start",
                          i.level === "danger" 
                            ? "border-danger/30 bg-danger/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                            : i.level === "warning" 
                              ? "border-warning/40 bg-warning/5"
                              : i.level === "success"
                                ? "border-primary/40 bg-primary/10"
                                : "border-primary/20 bg-primary/5"
                        )}
                      >
                        <div className="text-3xl mt-1 shrink-0 p-2 bg-background/50 rounded-xl border border-border/40">
                          {i.icon}
                        </div>
                        <div className="flex-1 w-full space-y-3">
                          <div className={cn(
                            "text-lg font-bold tracking-tight border-b border-border/40 pb-2",
                            i.level === "danger" ? "text-danger" : i.level === "warning" ? "text-warning-foreground" : "text-primary"
                          )}>
                            {i.titre}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-semibold text-foreground/90 uppercase text-xs tracking-wider opacity-80">Le Constat</span>
                              <div className="text-foreground/80 mt-0.5">{i.whatIsHappening}</div>
                            </div>
                            <div className="bg-background/40 p-2 rounded-lg border border-border/30">
                              <span className="font-semibold text-foreground/90 uppercase text-xs tracking-wider opacity-80 flex items-center gap-1">
                                🎯 Action Recommandée
                              </span>
                              <div className="text-foreground font-medium mt-0.5">{i.whatToDo}</div>
                            </div>
                            <div>
                              <span className="font-semibold text-foreground/90 uppercase text-xs tracking-wider opacity-80">L'Impact</span>
                              <div className="text-muted-foreground mt-0.5 italic">{i.whyItMatters}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[800ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
              <CardHeader>
                <div>
                  <CardTitle className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Météo Agricole (5 Jours)</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>Prévisions pour votre oliveraie</span>
                    {lastFetched && <span className="text-[10px] opacity-60">Màj: {lastFetched}</span>}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="flex justify-center py-4"><Skeleton className="h-16 w-full" /></div>
                ) : weather ? (
                  <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                    {weather.daily.dates.slice(0, 5).map((date, i) => (
                      <div key={date} className="flex-1 min-w-[80px] bg-background/50 border border-border/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-2">
                        <div className="text-xs font-semibold text-muted uppercase tracking-wider">
                          {new Date(date).toLocaleDateString("fr-FR", { weekday: "short" })}
                        </div>
                        <div className="text-2xl py-1">
                          {weather.daily.precipitation[i] > 2 ? (
                            <CloudRain className="w-6 h-6 text-primary" />
                          ) : weather.daily.maxTemps[i] > 30 ? (
                            <Sun className="w-6 h-6 text-warning" />
                          ) : weather.daily.maxTemps[i] < 10 ? (
                            <Snowflake className="w-6 h-6 text-blue-300" />
                          ) : (
                            <Cloud className="w-6 h-6 text-muted" />
                          )}
                        </div>
                        <div className="text-sm font-bold">{Math.round(weather.daily.maxTemps[i])}°</div>
                        <div className="text-xs text-muted">{Math.round(weather.daily.minTemps[i])}°</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted text-center py-4">Météo indisponible</div>
                )}
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  sub,
  delay = "delay-0",
}: {
  title: string;
  value: string;
  sub: string;
  delay?: string;
}) {
  return (
    <Card className={cn(
      "border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden",
      "animate-in fade-in zoom-in-95 duration-500 fill-mode-both",
      delay
    )}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider line-clamp-1">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform origin-left">
          {value}
        </div>
        <CardDescription className="text-[10px] sm:text-xs mt-1 line-clamp-1">{sub}</CardDescription>
      </CardContent>
    </Card>
  );
}
