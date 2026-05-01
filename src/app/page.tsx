"use client";

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
import { buildInsights, farmTotals, recurringSeriesLast12Months } from "@/lib/derive";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useFarmData } from "@/lib/useFarmData";

export default function HomePage() {
  const farm = useFarmData();
  const state = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    recurrents: farm.recurrents,
    scenarios: farm.scenarios,
  };

  const totals = farmTotals(state);
  const insights = buildInsights(state);
  const recurringSeries = recurringSeriesLast12Months(state).map((p) => ({
    ...p,
    month: p.monthISO.slice(5, 7),
  }));

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
      actions={null}
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
          title="Coûts fixes / mois"
          value={formatMoneyDT(totals.monthlyRecurring)}
          sub="Charges récurrentes"
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
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div>
              <CardTitle className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Rentabilité (estimation)
              </CardTitle>
              <CardDescription>
                Recettes − (récurrents × 12 + dépenses 12 derniers mois)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/40 bg-background/40 p-4 transition-all hover:bg-background/60">
                <div className="text-xs text-muted font-medium uppercase tracking-wider">Recettes</div>
                <div className="mt-2 text-2xl font-bold tracking-tight">
                  {formatMoneyDT(totals.estimatedRevenue)}
                </div>
                <div className="mt-1 text-xs text-muted flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/40 inline-block"></span>
                  Prix: {formatNumber(state.settings.prixKgOlives || 0, 2)} / kg
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-background/40 p-4 transition-all hover:bg-background/60">
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
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div>
              <CardTitle>Charges récurrentes</CardTitle>
              <CardDescription>Projection simple sur 12 mois</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-44 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recurringSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        <Card className="md:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[700ms] fill-mode-both border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div>
              <CardTitle>Insights & Recommandations</CardTitle>
              <CardDescription>Analyse automatique de votre exploitation</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-background/30 rounded-2xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-xl text-primary">💡</span>
                </div>
                <div className="text-sm font-medium">Pas encore de données</div>
                <div className="text-xs text-muted mt-1 max-w-[250px]">
                  Ajoutez des lots et des dépenses pour obtenir des recommandations personnalisées.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.map((i, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
                      i.level === "danger" 
                        ? "border-danger/20 bg-danger/5 hover:border-danger/30" 
                        : i.level === "warning" 
                          ? "border-warning/30 bg-warning/5 hover:border-warning/40"
                          : i.level === "success"
                            ? "border-primary/30 bg-primary/10 hover:border-primary/40"
                            : "border-primary/20 bg-primary/5 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base leading-none">
                        {i.level === "danger" ? "🚨" : i.level === "warning" ? "⚠️" : i.level === "success" ? "✅" : "💡"}
                      </span>
                      <div className={cn(
                        "text-sm font-semibold tracking-tight",
                        i.level === "danger" ? "text-danger" : i.level === "warning" ? "text-warning-foreground" : "text-primary"
                      )}>
                        {i.titre}
                      </div>
                    </div>
                    <div className="text-xs text-muted/90 leading-relaxed">{i.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
      "border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group",
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
