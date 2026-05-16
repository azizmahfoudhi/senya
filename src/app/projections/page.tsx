"use client";

import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, LineChart, Line, YAxis, Legend } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatKg, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { computeLotForecast, computeMultiYearForecast } from "@/lib/intelligence";
import { Sprout, TrendingUp, AlertTriangle, Coins } from "lucide-react";

export default function ProjectionsPage() {
  const farm = useFarmData();

  const baseState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
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
    <AppShell title="Projections & IA">
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Moteur de Projections
            </h1>
            <p className="text-muted-foreground font-medium max-w-md pt-1">Analyse prédictive basée sur l'âge des arbres, les cycles climatiques et vos données historiques.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20 animate-pulse-glow">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">IA Active</span>
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card rounded-[2rem] border-border/40 shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Sprout className="w-3.5 h-3.5 text-primary" /> Rendement Prévu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{formatKg(totalYield)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-[2rem] border-border/40 shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-warning" /> Coût Estimé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{formatMoneyDT(totalCost)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-[2rem] border-border/40 shadow-xl shadow-black/5 hover:scale-[1.02] transition-transform duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-success" /> Recettes IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-success">{formatMoneyDT(revenue)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-[2rem] border-primary/30 bg-primary/5 shadow-xl shadow-primary/5 hover:scale-[1.02] transition-transform duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Bénéfice Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tighter ${totalProfit >= 0 ? "text-primary" : "text-danger"}`}>
                {formatMoneyDT(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RISKS SECTION */}
        {allRisks.size > 0 && (
          <Card className="border-danger/30 bg-danger/5 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
              <AlertTriangle className="w-24 h-24 text-danger" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-danger flex items-center gap-2 font-bold">
                <AlertTriangle className="w-5 h-5 animate-pulse" /> Risques Systémiques Détectés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(allRisks).map((r, i) => (
                  <div key={i} className="text-xs font-bold bg-danger/10 text-danger px-4 py-2 rounded-xl border border-danger/20">
                    {r}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* LONG TERM ANTICIPATION SECTION */}
        <div className="pt-12 mt-4 space-y-8 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-bold tracking-tighter">Trajectoire sur 15 Ans</h2>
            <p className="text-muted-foreground font-medium">Simulation de la maturité biologique de l'oliveraie.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Production Chart */}
            <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-2xl relative overflow-hidden group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">Potentiel de Production</CardTitle>
                    <CardDescription className="font-medium">Rendement cumulé en Kg</CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Sprout className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 -ml-4 pr-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={computeMultiYearForecast(baseState, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 700 }} dx={-5} width={40} />
                      <Tooltip
                        cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                        contentStyle={{ borderRadius: 20, border: "1px solid var(--border)", background: "rgba(var(--card-rgb), 0.8)", backdropFilter: "blur(12px)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: unknown) => [formatKg(Number(v)), "Production"]}
                        labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="yieldKg" 
                        stroke="var(--primary)" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }} 
                        activeDot={{ r: 8, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Financial Chart */}
            <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-2xl relative overflow-hidden group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">Rentabilité Future</CardTitle>
                    <CardDescription className="font-medium">Chiffre d'Affaires vs Profit Net</CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 -ml-4 pr-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={computeMultiYearForecast(baseState, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 700 }} dy={10} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 700 }} dx={-5} width={40} />
                      <Tooltip
                        cursor={{ stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '5 5' }}
                        contentStyle={{ borderRadius: 20, border: "1px solid var(--border)", background: "rgba(var(--card-rgb), 0.8)", backdropFilter: "blur(12px)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        formatter={(v: unknown) => formatMoneyDT(Number(v))}
                        labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <Line type="monotone" dataKey="revenueDt" name="Revenus" stroke="var(--success)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="profitDt" name="Profit" stroke="var(--primary)" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
