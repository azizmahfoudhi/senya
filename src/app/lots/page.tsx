"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import {
  ageYearsFromISO,
  batchEstimatedProductionKg,
  sumExpensesForBatch,
} from "@/lib/engine";
import { formatAge, formatKg, formatMoneyDT, formatNumber, formatProduction } from "@/lib/format";
import { todayISO } from "@/lib/derive";
import { useFarmData } from "@/lib/useFarmData";
import { computeLotHealth } from "@/lib/intelligence";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import type { StressLevel } from "@/lib/domain";
import {
  Trees,
  Plus,
  Layers,
  Droplets,
  DropletOff,
  Edit2,
  X,
  Check,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";

export default function LotsPage() {
  const farm = useFarmData();
  const { projectedRainMm } = useHistoricalRain();
  const typeById = new Map(farm.types.map((t) => [t.id, t]));
  const tISO = todayISO();
  const totalTrees = farm.lots.reduce((acc, l) => acc + l.nbArbres, 0);

  return (
    <AppShell
      title="Patrimoine Végétal"
      actions={
        <Link href="/structure">
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nouveau lot
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Summary pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
            <Trees className="w-4 h-4 text-primary" />
            <span className="font-semibold">{formatNumber(totalTrees)}</span>
            <span className="text-muted">arbres</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-semibold">{farm.lots.length}</span>
            <span className="text-muted">lots</span>
          </div>
        </div>

        {/* Empty state */}
        {farm.lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-lg border border-dashed border-border">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Layers className="w-6 h-6 text-muted" />
            </div>
            <div>
              <p className="font-semibold text-sm">Aucun lot configuré</p>
              <p className="text-xs text-muted mt-1 max-w-xs">
                Ajoutez vos premières parcelles pour commencer à suivre votre production.
              </p>
            </div>
            <Link href="/structure">
              <Button size="sm">Créer mon premier lot</Button>
            </Link>
          </div>
        ) : (
          /* Lot list */
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {farm.lots.map((lot, idx) => (
              <LotRow
                key={lot.id}
                lot={lot}
                farm={farm}
                typeById={typeById}
                tISO={tISO}
                rainMm={projectedRainMm}
                isLast={idx === farm.lots.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LotRow({
  lot,
  farm,
  typeById,
  tISO,
  rainMm,
  isLast,
}: {
  lot: ReturnType<typeof useFarmData>["lots"][number];
  farm: ReturnType<typeof useFarmData>;
  typeById: Map<string, ReturnType<typeof useFarmData>["types"][number]>;
  tISO: string;
  rainMm: number;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Edit state
  const [nom, setNom] = React.useState(lot.nom);
  const [typeId, setTypeId] = React.useState(lot.typeId);
  const [datePlantation, setDatePlantation] = React.useState(lot.datePlantationISO);
  const [nb, setNb] = React.useState(String(lot.nbArbres));
  const [irrig, setIrrig] = React.useState(lot.irrigation);
  const [croissance, setCroissance] = React.useState<number>(lot.etatCroissance ?? 3);
  const [stress, setStress] = React.useState<StressLevel>(lot.stressLevel ?? "bas");

  const type = typeById.get(lot.typeId);
  const age = ageYearsFromISO(lot.datePlantationISO, tISO);
  const prod = type
    ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO, rainMm })
    : 0;
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
  const cost = sumExpensesForBatch(farmState, lot.id);

  const maturity =
    age < 3 ? "Pépinière" : age < 7 ? "Jeune" : age < 25 ? "Adulte" : "Ancien";
  const maturityVariant =
    age < 3 ? "muted" : age < 7 ? "warning" : age < 25 ? "success" : "default";

  const healthVariant =
    health.total >= 80
      ? "success"
      : health.total >= 60
      ? "primary"
      : health.total >= 40
      ? "warning"
      : "danger";

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

  async function handleDelete() {
    if (confirm(`Supprimer le lot "${lot.nom}" ? Cette action est irréversible.`)) {
      await farm.actions.removeBatch(lot.id);
    }
  }

  return (
    <div className={cn(!isLast && "border-b border-border")}>
      {/* Main row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
        onClick={() => { setIsExpanded(!isExpanded); setIsEditing(false); }}
      >
        {/* Left: name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{lot.nom}</span>
            <Badge variant={maturityVariant}>{maturity}</Badge>
            {lot.irrigation === "non_irrigue" ? (
              <Badge variant="muted">
                <DropletOff className="w-2.5 h-2.5" /> Bour
              </Badge>
            ) : (
              <Badge variant="primary">
                <Droplets className="w-2.5 h-2.5" /> Irrigué
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {type ? type.nom : <span className="text-warning flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Variété inconnue</span>}
            {" · "}
            {formatAge(age)}
          </div>
        </div>

        {/* Center: trees + prod */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-sm">
          <div className="text-right">
            <div className="font-semibold">{formatNumber(lot.nbArbres)}</div>
            <div className="text-[10px] text-muted uppercase tracking-wide">Arbres</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-primary">{formatProduction(prod, age)}</div>
            <div className="text-[10px] text-muted uppercase tracking-wide">Potentiel</div>
          </div>
        </div>

        {/* Right: health score + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={healthVariant}>{health.total}/100</Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/20 px-4 py-4 space-y-4">
          {isEditing ? (
            /* Edit form */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Modifier le lot
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-success" onClick={handleSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du lot" />

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                >
                  <option value="">Variété...</option>
                  {farm.types.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
                <select
                  className="h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm"
                  value={irrig}
                  onChange={(e) => setIrrig(e.target.value as typeof irrig)}
                >
                  <option value="non_irrigue">Bour (Non irrigué)</option>
                  <option value="faible">Irrigué (Faible)</option>
                  <option value="normal">Irrigué (Normal)</option>
                  <option value="optimal">Irrigué (Optimal)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={datePlantation} onChange={(e) => setDatePlantation(e.target.value)} />
                <Input inputMode="numeric" min="1" value={nb} onChange={(e) => setNb(e.target.value)} placeholder="Nb arbres" />
              </div>

              {/* Growth stars */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted flex items-center justify-between">
                  <span>État de production</span>
                  <span>
                    {croissance === 1 && "Critique (0.4x)"}
                    {croissance === 2 && "Faible (0.7x)"}
                    {croissance === 3 && "Normal (1.0x)"}
                    {croissance === 4 && "Bon (1.2x)"}
                    {croissance === 5 && "Excellent (1.5x)"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCroissance(star)}
                      className={cn("p-1 rounded transition-colors", star <= croissance ? "text-warning" : "text-muted")}
                    >
                      <Star className={cn("w-4 h-4", star <= croissance && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress level */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">État de Santé</div>
                <div className="flex gap-1.5">
                  {[
                    { id: "bas" as StressLevel, label: "Excellente" },
                    { id: "moyen" as StressLevel, label: "Moyenne" },
                    { id: "eleve" as StressLevel, label: "Faible" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStress(s.id)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-md border text-xs font-semibold transition-colors",
                        stress === s.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted hover:border-primary/40"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* View mode: health pillars + actions */
            <div className="space-y-3">
              {/* Mobile stats */}
              <div className="grid grid-cols-3 gap-2 sm:hidden text-center">
                <div className="rounded-md border border-border bg-card py-2">
                  <div className="font-bold text-sm">{formatNumber(lot.nbArbres)}</div>
                  <div className="text-[10px] text-muted uppercase">Arbres</div>
                </div>
                <div className="rounded-md border border-border bg-card py-2">
                  <div className="font-bold text-sm text-primary">{formatProduction(prod, age)}</div>
                  <div className="text-[10px] text-muted uppercase">Potentiel</div>
                </div>
                <div className="rounded-md border border-border bg-card py-2">
                  <div className="font-bold text-sm">{formatMoneyDT(cost)}</div>
                  <div className="text-[10px] text-muted uppercase">Investi</div>
                </div>
              </div>

              {/* Pillar bars */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: "Rendement", val: health.breakdown.yield },
                  { label: "Eau", val: health.breakdown.water },
                  { label: "Finances", val: health.breakdown.financial },
                  { label: "Santé", val: health.breakdown.stress },
                ].map((p) => (
                  <div key={p.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted font-medium">{p.label}</span>
                      <span className="font-semibold tabular-nums">{p.val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.val >= 80 ? "bg-success" : p.val >= 50 ? "bg-warning" : "bg-danger"
                        )}
                        style={{ width: `${p.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted">
                  Investi: <span className="font-semibold text-foreground">{formatMoneyDT(cost)}</span>
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} title="Modifier">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-danger" onClick={handleDelete} title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Link href={`/lots/${lot.id}`}>
                    <Button size="sm" variant="outline">Détails</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
