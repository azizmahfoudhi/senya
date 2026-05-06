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
import { Trees, Sprout, Layers, Wallet, ArrowRight, TrendingUp, Settings, BrainCircuit, Sun, Cloud, Snowflake, CloudRain, Moon } from "lucide-react";
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
          <div className="flex flex-col sm:flex-row gap-6 items-stretch mb-10 mt-4 px-2">
            <div className="flex-1 space-y-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 shadow-xl shadow-primary/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter flex items-center gap-4">
                <span className="animate-float inline-block drop-shadow-sm">👋</span> 
                Bonjour.
              </h2>
              <p className="text-muted-foreground font-medium text-2xl pt-2 tracking-tight">
                Oliveraie de {farm.settings.surfaceHa} ha <span className="text-sm opacity-40 font-bold uppercase tracking-widest ml-2">({farm.lots.length} parcelles actives)</span>
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4 relative z-10">
                <div className="inline-flex items-center gap-4 bg-background/60 backdrop-blur-xl px-6 py-3.5 rounded-2xl border border-border/40 shadow-xl shadow-black/5 animate-pulse-glow">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Indice Santé</span>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-3.5 w-3.5 rounded-full animate-pulse",
                      globalHealth >= 80 ? 'bg-success shadow-[0_0_12px_rgba(16,185,129,0.6)]' : globalHealth >= 50 ? 'bg-warning shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                    )} />
                    <span className="font-black text-3xl tracking-tighter tabular-nums">{historyLoading ? "..." : globalHealth}<span className="text-xs opacity-40 font-bold ml-0.5">/100</span></span>
                  </div>
                </div>
                
                <Link href="/lots" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 group/btn">
                  Gérer les lots <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Population"
              value={formatNumber(totals.totalTrees)}
              sub={`${state.lots.length} parcelles`}
              delay="delay-[100ms]"
              icon={<Trees className="w-3 h-3" />}
            />
            <MetricCard
              title="Investi"
              value={formatMoneyDT(totals.totalInvestment)}
              sub="Capex total"
              delay="delay-[200ms]"
              icon={<Wallet className="w-3 h-3" />}
            />
            <MetricCard
              title="OPEX / 12 mois"
              value={formatMoneyDT(totals.estimatedYearlyCosts)}
              sub="Coûts tournants"
              delay="delay-[300ms]"
              icon={<TrendingUp className="w-3 h-3" />}
            />
            <MetricCard
              title="Rendement"
              value={formatKg(totals.estimatedYearlyProductionKg)}
              sub="Production estimée"
              delay="delay-[400ms]"
              icon={<Sprout className="w-3 h-3" />}
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
            <Card className="md:col-span-2 glass-card rounded-[2.5rem] shadow-xl overflow-hidden group border-border/40">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tighter">Météo Agricole</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conditions actuelles et prévisions à 5 jours</CardDescription>
                  </div>
                  {weather && (
                    <div className="text-right">
                      <div className="text-3xl font-black tracking-tighter text-primary">{weather.current.temp}°C</div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Nasrallah, Kairouan</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {weatherLoading ? (
                  <div className="flex justify-center py-8"><Skeleton className="h-24 w-full rounded-2xl" /></div>
                ) : weather ? (
                  <div className="space-y-8">
                    {/* CURRENT DETAILS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/40 backdrop-blur-md p-4 rounded-2xl border border-border/40 flex flex-col items-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">Vent</div>
                        <div className="text-lg font-black">{weather.current.windSpeed} km/h</div>
                      </div>
                      <div className="bg-background/40 backdrop-blur-md p-4 rounded-2xl border border-border/40 flex flex-col items-center">
                        <div className="text-[10px] font-black uppercase text-muted mb-1">UV</div>
                        <div className="text-lg font-black">{weather.daily.uvIndex[0] || 6}</div>
                      </div>
                    </div>

                    {/* 5-DAY STRIP */}
                    <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                      {weather.daily.dates.slice(0, 5).map((date, i) => (
                        <div key={date} className="flex-1 min-w-[100px] bg-background/30 border border-border/20 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 group/day hover:bg-primary/5 transition-all">
                          <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                            {new Date(date).toLocaleDateString("fr-FR", { weekday: "short" })}
                          </div>
                          <div className="py-2 transform group-hover/day:scale-110 transition-transform">
                            {weather.daily.precipitation[i] > 2 ? (
                              <CloudRain className="w-8 h-8 text-primary" />
                            ) : weather.daily.maxTemps[i] > 30 ? (
                              <Sun className="w-8 h-8 text-warning" />
                            ) : weather.daily.maxTemps[i] < 10 ? (
                              <Snowflake className="w-8 h-8 text-blue-300" />
                            ) : (
                              <Cloud className="w-8 h-8 text-muted" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-black tracking-tight">{Math.round(weather.daily.maxTemps[i])}°</div>
                            <div className="text-[10px] font-bold text-muted">{Math.round(weather.daily.minTemps[i])}°</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted text-center py-8">Données météo temporairement indisponibles</div>
                )}
              </CardContent>
            </Card>

            {/* RECENT ACTIVITY SECTION */}
            <Card className="md:col-span-2 glass-card rounded-[2.5rem] shadow-xl overflow-hidden group border-border/40">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tighter">Opérations Récentes</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Historique direct des derniers flux</CardDescription>
                  </div>
                  <Link href="/depenses">
                    <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      Voir tout <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {farm.depenses.slice(0, 4).map((d) => (
                    <div key={d.id} className="p-6 flex items-center justify-between hover:bg-primary/[0.02] transition-colors group/row">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center border border-border/30 group-hover/row:bg-primary/10 group-hover/row:border-primary/20 transition-all">
                          <Wallet className="w-6 h-6 text-muted group-hover/row:text-primary transition-colors" />
                        </div>
                        <div>
                          <div className="text-sm font-black tracking-tight">{formatMoneyDT(d.montant)}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {d.categorie} • {new Date(d.dateISO).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase text-muted">Statut</div>
                        <div className="text-xs font-bold text-success">Validé</div>
                      </div>
                    </div>
                  ))}
                </div>
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
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  delay?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className={cn(
      "glass-card rounded-[2rem] border-border/40 shadow-xl shadow-black/5 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden",
      "animate-in fade-in zoom-in-95 duration-700 fill-mode-both",
      delay
    )}>
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:scale-[1.02] transition-transform origin-left">
          {value}
        </div>
        <CardDescription className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 line-clamp-1">{sub}</CardDescription>
      </CardContent>
    </Card>
  );
}
