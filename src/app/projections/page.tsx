"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatKg, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import {
  computeLotForecast,
  computeMultiYearForecast,
} from "@/lib/intelligence";
import { Sprout, TrendingUp, AlertTriangle, Coins } from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = "season" | "multiyear";

export default function ProjectionsPage() {
  const farm = useFarmData();
  const [activeTab, setActiveTab] = React.useState<Tab>("season");

  const baseState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  const forecasts = farm.lots.map((l) => ({
    lot: l,
    forecast: computeLotForecast(baseState, l.id),
  }));

  let totalYield = 0;
  let totalCost = 0;
  let totalProfit = 0;
  const allRisks = new Set<string>();

  forecasts.forEach((f) => {
    totalYield += f.forecast.yieldKg;
    totalCost += f.forecast.costDt;
    totalProfit += f.forecast.profitDt;
    f.forecast.risks.forEach((r) => allRisks.add(r));
  });

  const revenue = totalProfit + totalCost;
  const multiYear = computeMultiYearForecast(baseState, 15);

  const confidenceVariant = (c: string) =>
    c === "Élevée" ? "success" : c === "Moyenne" ? "warning" : "muted";

  return (
    <AppShell title="Prévisions & IA">
      <div className="space-y-4">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Rendement prévu"
            value={formatKg(totalYield)}
            icon={<Sprout className="w-4 h-4" />}
          />
          <Stat
            label="Coût estimé"
            value={formatMoneyDT(totalCost)}
            icon={<Coins className="w-4 h-4" />}
          />
          <Stat
            label="Recettes IA"
            value={formatMoneyDT(revenue)}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <Stat
            label="Bénéfice net"
            value={
              <span className={totalProfit >= 0 ? "text-success" : "text-danger"}>
                {formatMoneyDT(totalProfit)}
              </span>
            }
          />
        </div>

        {/* Risk banner */}
        {allRisks.size > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 border-l-[3px] border-l-danger">
            <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-danger mb-2">
                Risques systémiques détectés
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(allRisks).map((r, i) => (
                  <Badge key={i} variant="danger">{r}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {[
            { id: "season" as Tab, label: "Cette Saison" },
            { id: "multiyear" as Tab, label: "Trajectoire 15 Ans" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Season tab */}
        {activeTab === "season" && (
          <Card>
            <CardHeader>
              <CardTitle>Prévisions par Parcelle — Saison en cours</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {farm.lots.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted">
                  Aucun lot configuré. Ajoutez des parcelles pour voir les prévisions.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lot</TableHead>
                      <TableHead className="text-right">Rendement</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Coût</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Recettes</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead className="hidden md:table-cell">Risques</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.map(({ lot, forecast }) => {
                      const lotRevenue = forecast.yieldKg * (farm.settings.prixKgOlives || 1);
                      return (
                        <TableRow key={lot.id}>
                          <TableCell className="font-medium">{lot.nom}</TableCell>
                          <TableCell className="text-right">{formatKg(forecast.yieldKg)}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell text-muted">
                            {formatMoneyDT(forecast.costDt)}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {formatMoneyDT(lotRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "font-semibold",
                                forecast.profitDt >= 0 ? "text-success" : "text-danger"
                              )}
                            >
                              {formatMoneyDT(forecast.profitDt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={confidenceVariant(forecast.confidence)}>
                              {forecast.confidence}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {forecast.risks.map((r, i) => (
                                <Badge key={i} variant="warning" className="text-[9px]">
                                  {r.length > 40 ? r.slice(0, 38) + "…" : r}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Multi-year tab */}
        {activeTab === "multiyear" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Production chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Potentiel de Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={multiYear}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="year"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 10 }}
                          dy={8}
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 10 }}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            fontSize: "12px",
                          }}
                          formatter={(v: unknown) => [formatKg(Number(v)), "Production"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="yieldKg"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Financial chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Rentabilité Future</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={multiYear}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="year"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 10 }}
                          dy={8}
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "var(--muted)", fontSize: 10 }}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            fontSize: "12px",
                          }}
                          formatter={(v: unknown) => formatMoneyDT(Number(v))}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenueDt"
                          name="Revenus"
                          stroke="var(--success)"
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="profitDt"
                          name="Profit"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary table */}
            <Card>
              <CardHeader>
                <CardTitle>Tableau de Trajectoire — 15 Ans</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">Production</TableHead>
                      <TableHead className="text-right">Coûts</TableHead>
                      <TableHead className="text-right">Revenus</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {multiYear.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell className="text-right">{formatKg(row.yieldKg)}</TableCell>
                        <TableCell className="text-right text-muted">{formatMoneyDT(row.costDt)}</TableCell>
                        <TableCell className="text-right">{formatMoneyDT(row.revenueDt)}</TableCell>
                        <TableCell className="text-right">
                          <span className={row.profitDt >= 0 ? "text-success font-semibold" : "text-danger font-semibold"}>
                            {formatMoneyDT(row.profitDt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
