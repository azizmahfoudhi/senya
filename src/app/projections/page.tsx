"use client";

import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatKg, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { computeLotForecast } from "@/lib/intelligence";
import { Sprout, TrendingUp, AlertTriangle, Coins } from "lucide-react";

export default function ProjectionsPage() {
  const farm = useFarmData();

  const baseState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    tasks: farm.tasks,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  // Compute forecasts for all lots
  const forecasts = farm.lots.map(l => ({
    lot: l,
    forecast: computeLotForecast(baseState, l.id)
  }));

  // Aggregate totals
  let totalYield = 0;
  let totalCost = 0;
  let totalProfit = 0;
  const allRisks = new Set<string>();

  forecasts.forEach(f => {
    totalYield += f.forecast.yieldKg;
    totalCost += f.forecast.costDt;
    totalProfit += f.forecast.profitDt;
    f.forecast.risks.forEach(r => allRisks.add(r));
  });

  const revenue = totalProfit + totalCost;

  // Chart data
  const chartData = forecasts.map(f => ({
    name: f.lot.nom,
    Revenus: f.forecast.yieldKg * (farm.settings.prixKgOlives || 1),
    Coûts: f.forecast.costDt,
    Profit: f.forecast.profitDt,
  }));

  return (
    <AppShell title="Moteur de Prévisions">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Prévisions Saison Prochaine
          </h1>
          <p className="text-sm text-muted">Générées par l'IA en fonction de l'âge, l'historique et des pratiques.</p>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sprout className="w-3 h-3" /> Rendement Prévu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatKg(totalYield)}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3 text-warning" /> Coût Total Estimé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoneyDT(totalCost)}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3 text-success" /> Recettes Prévues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatMoneyDT(revenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-primary/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-primary font-bold">Bénéfice Net Attendu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-black ${totalProfit >= 0 ? "text-primary" : "text-danger"}`}>
                {formatMoneyDT(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RISKS SECTION */}
        {allRisks.size > 0 && (
          <Card className="border-danger/30 bg-danger/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-danger flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Risques Systémiques Détectés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {Array.from(allRisks).map((r, i) => (
                  <li key={i} className="text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CHART BY LOT */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Détail Financier par Lot</CardTitle>
            <CardDescription>Revenus attendus VS Coûts prévus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} dy={10} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                    formatter={(v: unknown) => formatMoneyDT(Number(v))}
                  />
                  <Bar dataKey="Revenus" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Coûts" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
