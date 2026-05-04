"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { ageYearsFromISO, batchEstimatedProductionKg, sumExpensesForBatch } from "@/lib/engine";
import { formatKg, formatMoneyDT, formatNumber, formatProduction } from "@/lib/format";
import { todayISO } from "@/lib/derive";
import { useFarmData } from "@/lib/useFarmData";
import { computeLotHealth } from "@/lib/intelligence";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import { Trees, Plus, Map as MapIcon, Droplets, DropletOff, Edit2, X, Check, Trash2, Star, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function LotsPage() {
  const farm = useFarmData();
  const { projectedRainMm } = useHistoricalRain();
  const typeById = new Map(farm.types.map((t) => [t.id, t]));
  const tISO = todayISO();

  const totalTrees = farm.lots.reduce((acc, l) => acc + l.nbArbres, 0);

  return (
    <AppShell 
      title="Mes Lots" 
      actions={
        <Link href="/structure">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau lot
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4">
        {/* Summary Header */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider">Total Arbres</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Trees className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {formatNumber(totalTrees)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider">Nombre de Lots</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapIcon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {farm.lots.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {farm.lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-2xl bg-muted/5 mt-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MapIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Aucun lot configuré</h3>
            <p className="text-muted text-sm max-w-[300px] mb-6">
              Séparez votre ferme en lots pour suivre précisément le rendement et les coûts selon l'âge et la variété.
            </p>
            <Link href="/structure">
              <Button>Créer mon premier lot</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {farm.lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} farm={farm} typeById={typeById} tISO={tISO} rainMm={projectedRainMm} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LotCard({ lot, farm, typeById, tISO, rainMm }: { lot: any; farm: ReturnType<typeof useFarmData>; typeById: Map<string, any>; tISO: string; rainMm: number }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [nom, setNom] = React.useState(lot.nom);
  const [typeId, setTypeId] = React.useState(lot.typeId);
  const [datePlantation, setDatePlantation] = React.useState(lot.datePlantationISO);
  const [nb, setNb] = React.useState(String(lot.nbArbres));
  const [irrig, setIrrig] = React.useState(lot.irrigation);
  const [croissance, setCroissance] = React.useState<number>(lot.etatCroissance ?? 3);
  const [stress, setStress] = React.useState<import("@/lib/domain").StressLevel>(lot.stressLevel ?? "bas");

  const type = typeById.get(lot.typeId);
  const age = ageYearsFromISO(lot.datePlantationISO, tISO);
  const prod = type ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO, rainMm: rainMm }) : 0;
  const cost = sumExpensesForBatch(
    {
      settings: farm.settings,
      types: farm.types,
      lots: farm.lots,
      depenses: farm.depenses,
      yields: farm.yields,
      treatments: farm.treatments,
      scenarios: farm.scenarios,
    },
    lot.id,
  );

  const farmState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };
  const health = computeLotHealth(farmState, lot.id, rainMm);

  async function handleSave() {
    if (!nom.trim() || !typeId) return;
    await farm.actions.updateBatch(lot.id, {
      nom: nom.trim(),
      typeId,
      datePlantationISO: datePlantation,
      nbArbres: Math.max(1, Number(nb || 0)),
      irrigation: irrig,
      etatCroissance: croissance,
      stressLevel: stress,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <Card className="border-primary/50 bg-primary/5 shadow-sm">
        <CardContent className="p-4 grid gap-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="font-semibold text-sm">Modifier le lot</div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du lot" className="bg-background h-9" />
          
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Variété...</option>
              {farm.types.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={irrig}
              onChange={(e) => setIrrig(e.target.value as any)}
            >
              <option value="non_irrigue">Bour (Non irrigué)</option>
              <option value="faible">Irrigué (Faible)</option>
              <option value="normal">Irrigué (Normal)</option>
              <option value="optimal">Irrigué (Optimal)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={datePlantation} onChange={e => setDatePlantation(e.target.value)} className="bg-background h-9" />
            <Input inputMode="numeric" min="1" value={nb} onChange={e => setNb(e.target.value)} className="bg-background h-9" placeholder="Nb arbres" />
          </div>

          <label className="grid gap-1.5">
            <div className="text-xs font-medium text-foreground/80 flex items-center justify-between">
              <span>État de production</span>
              <span className="text-[10px] text-muted">
                {croissance === 1 && "Critique (0.4x)"}
                {croissance === 2 && "Faible (0.7x)"}
                {croissance === 3 && "Normal (1.0x)"}
                {croissance === 4 && "Bon (1.2x)"}
                {croissance === 5 && "Excellent (1.5x)"}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-background/50 p-1.5 rounded-md border border-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCroissance(star)}
                  className={`p-1 rounded-md transition-colors ${
                    star <= croissance ? "text-warning hover:text-warning/80" : "text-muted hover:text-muted/80"
                  }`}
                >
                  <Star className={`w-4 h-4 ${star <= croissance ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </label>
          <div className="grid gap-1.5">
            <div className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider px-0.5">État de Santé (Vigueur, Sécheresse)</div>
            <div className="flex gap-1.5">
              {[
                { id: "bas", label: "Excellente", desc: "Sain" },
                { id: "moyen", label: "Moyenne", desc: "Passable" },
                { id: "eleve", label: "Faible", desc: "Critique" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStress(s.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 px-1 rounded-xl border transition-all",
                    stress === s.id 
                      ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                      : "bg-background border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-bold">{s.label}</span>
                  <span className="text-[9px] opacity-80 uppercase font-medium">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between min-w-0 gap-4">
          <div>
            <CardTitle className="truncate text-lg mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{lot.nom}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {lot.typeId && type ? (
                <span className="font-medium text-foreground/80">{type.nom}</span>
              ) : (
                <span className="font-bold text-primary flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {type?.nom || "Chemlali"} (Défaut)
                </span>
              )}
              <span>•</span>
              <span>{formatNumber(age, 1)} ans</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {lot.irrigation === "optimal" ? (
                  <><Droplets className="w-3 h-3 text-blue-500" /> Optimal</>
                ) : lot.irrigation === "normal" ? (
                  <><Droplets className="w-3 h-3 text-blue-400" /> Normal</>
                ) : lot.irrigation === "faible" ? (
                  <><DropletOff className="w-3 h-3 text-blue-300" /> Faible</>
                ) : (
                  <><DropletOff className="w-3 h-3 text-muted" /> Bour</>
                )}
              </span>
              {lot.etatCroissance !== 3 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5" title="État de production">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= (lot.etatCroissance ?? 3) ? "text-warning fill-current" : "text-muted"}`}
                      />
                    ))}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 flex-1 flex flex-col">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">Arbres</div>
            <div className="text-base font-bold">{formatNumber(lot.nbArbres)}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">Rendement</div>
            <div className="text-base font-bold text-primary truncate">{formatProduction(prod, age)}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">Évaluation</div>
            <div className={`text-base font-black ${health.colorClass}`}>
              {health.total}<span className="text-[10px] opacity-50">/100</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2 bg-background/30 p-3 rounded-2xl border border-border/20">
          {[
            { label: "Rendement", val: health.breakdown.yield, color: health.breakdown.yield < 50 ? 'from-danger/80 to-danger' : health.breakdown.yield < 80 ? 'from-warning/80 to-warning' : 'from-success/80 to-success' },
            { label: "Eau", val: health.breakdown.water, color: health.breakdown.water < 50 ? 'from-danger/80 to-danger' : health.breakdown.water < 80 ? 'from-warning/80 to-warning' : 'from-success/80 to-success' },
            { label: "Finances", val: health.breakdown.financial, color: health.breakdown.financial < 50 ? 'from-danger/80 to-danger' : health.breakdown.financial < 80 ? 'from-warning/80 to-warning' : 'from-success/80 to-success' },
            { label: "Santé", val: health.breakdown.stress, color: health.breakdown.stress < 50 ? 'from-danger/80 to-danger' : health.breakdown.stress < 80 ? 'from-warning/80 to-warning' : 'from-success/80 to-success' },
          ].map((p, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{p.label}</span>
                <span className="text-[10px] font-black tabular-nums">{p.val}%</span>
              </div>
              <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden border border-border/10 shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${p.color}`} 
                  style={{ width: `${p.val}%` }} 
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="text-xs text-muted">
            Invest: <span className="font-semibold text-foreground">{formatMoneyDT(cost)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0" 
              onClick={() => setIsEditing(true)}
              title="Modifier le lot"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-danger opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0" 
              onClick={() => {
                if (confirm(`Voulez-vous vraiment supprimer le lot "${lot.nom}" ? Cette action est irréversible.`)) {
                  farm.actions.removeBatch(lot.id);
                }
              }}
              title="Supprimer le lot"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Link href={`/lots/${lot.id}`}>
              <Button size="sm" variant="secondary" className="h-8 ml-1" title="Voir les détails et l'historique">Détails</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

