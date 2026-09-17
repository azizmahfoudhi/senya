"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  buildInsights,
  farmTotals,
  expensesSeriesLast12Months,
} from "@/lib/derive";
import { useWeather } from "@/lib/useWeather";
import { computeGlobalHealth } from "@/lib/intelligence";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useFarmData } from "@/lib/useFarmData";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import {
  Trees,
  Wallet,
  TrendingUp,
  Sprout,
  Bell,
  Settings,
  ArrowRight,
  CheckCircle2,
  X,
  Wind,
  Thermometer,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
} from "lucide-react";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/domain";

export default function HomePage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading } = useWeather();
  const { projectedRainMm, loading: historyLoading } = useHistoricalRain();

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
  const globalHealth = computeGlobalHealth(state, projectedRainMm);

  const healthLabel =
    globalHealth >= 80
      ? "Excellent"
      : globalHealth >= 60
      ? "Stable"
      : globalHealth >= 40
      ? "Moyen"
      : "Critique";
  const healthVariant =
    globalHealth >= 80
      ? "success"
      : globalHealth >= 60
      ? "primary"
      : globalHealth >= 40
      ? "warning"
      : "danger";

  const actions = (
    <div className="flex items-center gap-1">
      <Link
        href="/notifications"
        className="relative p-2 rounded-md hover:bg-secondary transition-colors"
      >
        <Bell className="w-4 h-4 text-muted" />
        {insights.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
        )}
      </Link>
      <Link
        href="/structure"
        className="p-2 rounded-md hover:bg-secondary transition-colors"
      >
        <Settings className="w-4 h-4 text-muted" />
      </Link>
    </div>
  );

  if (farm.loading) {
    return (
      <AppShell title="Tableau de Bord" actions={actions}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="md:col-span-2 h-40" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tableau de Bord" actions={actions}>
      {/* Error banner */}
      {farm.error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span className="font-semibold">Erreur Supabase:</span>
          <span className="flex-1">{farm.error}</span>
          <button
            className="text-xs font-bold underline"
            onClick={() => farm.refresh()}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty / onboarding state */}
      {farm.lots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sprout className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Bienvenue sur Senya
            </h2>
            <p className="text-muted text-sm max-w-sm">
              Suivez ces étapes pour démarrer vos projections de rentabilité.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-sm text-left">
            {[
              { step: "1", label: "Paramétrer la ferme", href: "/structure", sub: "Surface, prix, types d'arbres" },
              { step: "2", label: "Ajouter vos lots", href: "/lots", sub: "Parcelles et plantations" },
              { step: "3", label: "Saisir les dépenses", href: "/depenses", sub: "Frais et investissements" },
            ].map((s) => (
              <Link
                key={s.step}
                href={s.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-secondary transition-colors group"
              >
                <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {s.step}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-xs text-muted">{s.sub}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="Arbres"
              value={formatNumber(totals.totalTrees)}
              sub={`${state.lots.length} lots`}
              icon={<Trees className="w-4 h-4" />}
            />
            <Stat
              label="Investi"
              value={formatMoneyDT(totals.totalInvestment)}
              sub="Total CAPEX"
              icon={<Wallet className="w-4 h-4" />}
            />
            <Stat
              label="OPEX 12 mois"
              value={formatMoneyDT(totals.estimatedYearlyCosts)}
              sub="Charges récentes"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <Stat
              label="Production"
              value={formatKg(totals.estimatedYearlyProductionKg)}
              sub="Estimation annuelle"
              icon={<Sprout className="w-4 h-4" />}
            />
          </div>

          {/* Main 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Health card */}
            <Card>
              <CardHeader>
                <CardTitle>Santé Globale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 mb-4">
                  {historyLoading ? (
                    <Skeleton className="h-12 w-24" />
                  ) : (
                    <>
                      <span className="text-5xl font-bold tabular-nums leading-none">
                        {globalHealth}
                      </span>
                      <span className="text-muted mb-1">/100</span>
                      <Badge variant={healthVariant} className="mb-1">
                        {healthLabel}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Health bar */}
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-4">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      globalHealth >= 80
                        ? "bg-success"
                        : globalHealth >= 60
                        ? "bg-primary"
                        : globalHealth >= 40
                        ? "bg-warning"
                        : "bg-danger"
                    )}
                    style={{ width: `${globalHealth}%` }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    {[
                      { label: "Résultat net", value: formatMoneyDT(totals.profit), positive: totals.profit >= 0 },
                      { label: "Recettes est.", value: formatMoneyDT(totals.estimatedRevenue), positive: true },
                      { label: "Coût/kg", value: formatNumber(totals.costPerKg, 2) + " DT", positive: true },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between items-center">
                        <span className="text-muted">{r.label}</span>
                        <span className={cn("font-semibold", !r.positive && "text-danger")}>
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <Link
                    href="/projections"
                    className="flex items-center justify-between text-sm text-primary hover:underline"
                  >
                    <span className="font-medium">Voir les projections</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Expense chart */}
            <Card>
              <CardHeader>
                <CardTitle>Dépenses (12 mois)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44 -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={expensesSeries}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorMontant"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--primary)"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted)", fontSize: 11 }}
                        dy={8}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--card)",
                          color: "var(--foreground)",
                          fontSize: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                        formatter={(v: unknown) => [
                          formatMoneyDT(Number(v)),
                          "Montant",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="montant"
                        stroke="var(--primary)"
                        fill="url(#colorMontant)"
                        strokeWidth={2}
                        activeDot={{
                          r: 4,
                          fill: "var(--primary)",
                          stroke: "var(--card)",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertes & Recommandations IA</CardTitle>
                <span className="text-xs text-muted">{insights.length} alerte(s)</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {insights.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span>Aucune alerte — votre exploitation est en bonne santé.</span>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-l-[3px]",
                        insight.level === "danger"
                          ? "border-l-danger"
                          : insight.level === "warning"
                          ? "border-l-warning"
                          : insight.level === "success"
                          ? "border-l-success"
                          : "border-l-primary"
                      )}
                    >
                      <span className="text-xl shrink-0">{insight.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{insight.titre}</div>
                        <div className="text-xs text-muted mt-0.5 line-clamp-2">
                          {insight.whatIsHappening}
                        </div>
                        <div className="text-xs font-medium text-foreground mt-1">
                          🎯 {insight.whatToDo}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          farm.actions.setSettings({
                            readInsights: [
                              ...(farm.settings.readInsights || []),
                              insight.id,
                            ],
                          })
                        }
                        className="p-1 rounded hover:bg-secondary text-muted transition-colors shrink-0"
                        title="Marquer comme lu"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather */}
          <Card>
            <CardHeader>
              <CardTitle>Météo Agricole</CardTitle>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <Skeleton className="h-24" />
              ) : weather ? (
                <div className="space-y-4">
                  {/* Current conditions */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-warning shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted font-semibold tracking-wide">Temp</div>
                        <div className="font-bold text-sm">{weather.current.temp}°C</div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted font-semibold tracking-wide">Vent</div>
                        <div className="font-bold text-sm">{weather.current.windSpeed} km/h</div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-warning shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase text-muted font-semibold tracking-wide">UV</div>
                        <div className="font-bold text-sm">{weather.daily.uvIndex[0] ?? 6}</div>
                      </div>
                    </div>
                  </div>

                  {/* 5-day strip */}
                  <div className="grid grid-cols-5 gap-2">
                    {weather.daily.dates.slice(0, 5).map((date, i) => (
                      <div
                        key={date}
                        className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/20 px-2 py-2"
                      >
                        <div className="text-[10px] uppercase text-muted font-semibold tracking-wide">
                          {new Date(date).toLocaleDateString("fr-FR", { weekday: "short" })}
                        </div>
                        <div className="text-lg">
                          {weather.daily.precipitation[i] > 2
                            ? <CloudRain className="w-5 h-5 text-primary" />
                            : weather.daily.maxTemps[i] > 30
                            ? <Sun className="w-5 h-5 text-warning" />
                            : weather.daily.maxTemps[i] < 10
                            ? <Snowflake className="w-5 h-5 text-blue-400" />
                            : <Cloud className="w-5 h-5 text-muted" />}
                        </div>
                        <div className="font-bold text-xs">
                          {Math.round(weather.daily.maxTemps[i])}°
                        </div>
                        <div className="text-[10px] text-muted">
                          {Math.round(weather.daily.minTemps[i])}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted py-4 text-center">
                  Données météo indisponibles
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent ops */}
          {farm.depenses.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Opérations Récentes</CardTitle>
                  <Link
                    href="/depenses"
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farm.depenses.slice(0, 4).map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-muted">
                          {new Date(d.dateISO).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          {EXPENSE_CATEGORY_LABEL[d.categorie]}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatMoneyDT(d.montant)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">Validé</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
