"use client";

import * as React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { farmTotals, todayISO } from "@/lib/derive";
import { batchEstimatedProductionKg } from "@/lib/engine";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";

export default function ProjectionsPage() {
  const farm = useFarmData();
  const [years, setYears] = React.useState(10);

  const baseState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    harvests: farm.harvests,
    tasks: farm.tasks,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  const totalsNow = farmTotals(baseState);
  const tISO = todayISO();
  const typeById = new Map(farm.types.map((t) => [t.id, t]));

  // Projection simple: production croît via âge (lots existants), coûts = moyenne dépenses 12m
  const last12Total = farm.depenses
    .filter((e) => e.dateISO >= new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10))
    .reduce((acc, e) => acc + e.montant, 0);

  const annualCosts = last12Total; // approx

  const series = Array.from({ length: years + 1 }).map((_, i) => {
    const year = new Date().getFullYear() + i;
    const atISO = `${year}-09-01`; // période récolte
    const prodKg = farm.lots.reduce((acc, lot) => {
      const type = typeById.get(lot.typeId);
      if (!type) return acc;
      return acc + batchEstimatedProductionKg({ batch: lot, type, atISO });
    }, 0);
    const revenue = prodKg * (farm.settings.prixKgOlives || 0);
    const costs = annualCosts;
    const profit = revenue - costs;
    return { year: String(year), prodKg, revenue, costs, profit };
  });

  const breakEven = series.find((p) => p.profit >= 0)?.year ?? null;

  return (
    <AppShell title="Projections">
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Vue 5–10 ans</CardTitle>
              <CardDescription>Projection simple basée sur âge des lots + dépenses moyennes</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex gap-2">
              <button
                className={`h-10 px-4 rounded-xl border border-border text-sm ${years === 5 ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => setYears(5)}
              >
                5 ans
              </button>
              <button
                className={`h-10 px-4 rounded-xl border border-border text-sm ${years === 10 ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => setYears(10)}
              >
                10 ans
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Kpi label="Production (année 0)" value={formatKg(series[0]?.prodKg ?? 0)} />
              <Kpi label="Résultat (année 0)" value={formatMoneyDT(series[0]?.profit ?? 0)} />
              <Kpi label="Point mort" value={breakEven ? `${breakEven}` : "Non atteint"} />
              <Kpi label="Prix/kg" value={formatNumber(farm.settings.prixKgOlives || 0, 2)} />
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                    }}
                    formatter={(v: unknown, k: unknown) => {
                      const key = String(k);
                      if (key === "prodKg") return formatKg(Number(v));
                      return formatMoneyDT(Number(v));
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="costs" stroke="var(--warning)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" stroke="var(--foreground)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ce que fait la projection</CardTitle>
              <CardDescription>Simple, compréhensible, et améliorable</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted grid gap-2">
            <div>- La production augmente avec l’âge (courbe), ajustée par type et irrigation.</div>
            <div>- Les coûts annuels = approximation des dépenses des 12 derniers mois.</div>
            <div>- Pour simuler des décisions (nouveaux arbres / irrigation), on ajoute ensuite l’écran Scénarios.</div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

