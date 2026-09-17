"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import {
  ageYearsFromISO,
  batchEstimatedProductionKg,
  sumExpensesForBatch,
} from "@/lib/engine";
import { computeLotHealth, computeLotForecast } from "@/lib/intelligence";
import { todayISO } from "@/lib/derive";
import { formatAge, formatKg, formatMoneyDT, formatNumber, formatProduction } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import {
  Star,
  ShieldAlert,
  Bug,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Trees,
  Sprout,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function LotDetailPage() {
  const farm = useFarmData();
  const { projectedRainMm } = useHistoricalRain();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const lot = farm.lots.find((l) => l.id === id);
  const typeById = useMemo(() => new Map(farm.types.map((t) => [t.id, t])), [farm.types]);
  const tISO = todayISO();

  const [isEditing, setIsEditing] = useState(false);
  const [editNom, setEditNom] = useState(lot?.nom || "");
  const [editTypeId, setEditTypeId] = useState(lot?.typeId || "");
  const [editNb, setEditNb] = useState(String(lot?.nbArbres || 1));
  const [editIrrig, setEditIrrig] = useState(lot?.irrigation || "non_irrigue");
  const [editCroissance, setEditCroissance] = useState(lot?.etatCroissance ?? 3);
  const [editDate, setEditDate] = useState(lot?.datePlantationISO || "");

  if (!lot) {
    return (
      <AppShell title="Lot introuvable">
        <Card>
          <CardHeader>
            <CardTitle>Lot introuvable</CardTitle>
            <CardDescription>Ce lot n'existe pas ou a été supprimé.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lots">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Retour aux lots
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const type = typeById.get(lot.typeId);
  const lotAge = ageYearsFromISO(lot.datePlantationISO, tISO);
  const farmState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };
  const cost = sumExpensesForBatch(farmState, lot.id);
  const prod = type
    ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO, rainMm: projectedRainMm })
    : 0;
  const health = computeLotHealth(farmState, lot.id, projectedRainMm);
  const forecast = computeLotForecast(farmState, lot.id, projectedRainMm);
  const perTreeCost = lot.nbArbres > 0 ? cost / lot.nbArbres : 0;
  const yieldPerTree = lot.nbArbres > 0 ? prod / lot.nbArbres : 0;
  const lotTreatments = farm.treatments.filter((t) => t.lotId === lot.id);

  const healthVariant =
    health.total >= 80 ? "success" : health.total >= 60 ? "primary" : health.total >= 40 ? "warning" : "danger";

  async function handleSave() {
    if (!lot || !editNom.trim() || !editTypeId) return;
    await farm.actions.updateBatch(lot.id, {
      nom: editNom.trim(),
      typeId: editTypeId,
      nbArbres: Math.max(1, Number(editNb)),
      irrigation: editIrrig,
      etatCroissance: editCroissance,
      datePlantationISO: editDate,
    });
    setIsEditing(false);
  }

  return (
    <AppShell
      title={lot.nom}
      actions={
        <Link href="/lots">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted">
            <ArrowLeft className="w-3.5 h-3.5" />
            Lots
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Header stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Arbres"
            value={formatNumber(lot.nbArbres)}
            sub={formatAge(lotAge)}
            icon={<Trees className="w-4 h-4" />}
          />
          <Stat
            label="Production estimée"
            value={formatProduction(prod, lotAge)}
            sub={prod > 0 ? `${formatNumber(yieldPerTree, 1)} kg/arbre` : undefined}
            icon={<Sprout className="w-4 h-4" />}
          />
          <Stat
            label="Investi"
            value={formatMoneyDT(cost)}
            sub={`${formatMoneyDT(perTreeCost)}/arbre`}
            icon={<Wallet className="w-4 h-4" />}
          />
          <Stat
            label="Santé globale"
            value={
              <span className="flex items-center gap-2">
                {health.total}/100
                <Badge variant={healthVariant}>{health.weakestPillar}</Badge>
              </span>
            }
          />
        </div>

        {/* Summary card + edit */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Informations</CardTitle>
                <CardDescription>
                  {type?.nom ?? "Variété inconnue"} ·{" "}
                  {lot.irrigation === "optimal"
                    ? "Irrigué (Optimal)"
                    : lot.irrigation === "normal"
                    ? "Irrigué (Normal)"
                    : lot.irrigation === "faible"
                    ? "Irrigué (Faible)"
                    : "Bour"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Annuler
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          {isEditing && (
            <CardContent className="border-t border-border pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Nom</label>
                  <Input value={editNom} onChange={(e) => setEditNom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Variété</label>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm"
                    value={editTypeId}
                    onChange={(e) => setEditTypeId(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {farm.types.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Nb arbres</label>
                  <Input type="number" min="1" value={editNb} onChange={(e) => setEditNb(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Irrigation</label>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-sm"
                    value={editIrrig}
                    onChange={(e) => setEditIrrig(e.target.value as typeof editIrrig)}
                  >
                    <option value="non_irrigue">Bour</option>
                    <option value="faible">Faible</option>
                    <option value="normal">Normal</option>
                    <option value="optimal">Optimal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Plantation</label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-muted">État de production</label>
                  <span className="text-muted">
                    {editCroissance === 1 && "Critique (0.4x)"}
                    {editCroissance === 2 && "Faible (0.7x)"}
                    {editCroissance === 3 && "Normal (1.0x)"}
                    {editCroissance === 4 && "Bon (1.2x)"}
                    {editCroissance === 5 && "Excellent (1.5x)"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditCroissance(star)}
                      className={cn("p-1.5 rounded transition-colors", star <= editCroissance ? "text-warning" : "text-muted/30")}
                    >
                      <Star className={cn("w-5 h-5", star <= editCroissance && "fill-current")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handleSave}>
                  <Check className="w-3.5 h-3.5" /> Enregistrer
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Health pillars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Évaluation de Santé</CardTitle>
                <CardDescription>Basé sur 4 piliers analytiques</CardDescription>
              </div>
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  health.total >= 80 ? "text-success" : health.total >= 60 ? "text-primary" : health.total >= 40 ? "text-warning" : "text-danger"
                )}
              >
                {health.total}<span className="text-lg opacity-40">/100</span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
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
            <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted">
              ⚠️ Point faible actuel :{" "}
              <strong className="text-foreground">{health.weakestPillar}</strong>. Améliorer ce
              pilier augmentera rapidement votre score global.
            </div>
          </CardContent>
        </Card>

        {/* Forecast */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">🔮 Prévisions — Saison prochaine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Rendement prévu" value={formatKg(forecast.yieldKg)} />
              <Stat
                label="Bénéfice net prévu"
                value={
                  <span className={forecast.profitDt >= 0 ? "text-success" : "text-danger"}>
                    {formatMoneyDT(forecast.profitDt)}
                  </span>
                }
              />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Coût estimé</span>
                <span className="font-medium text-danger">{formatMoneyDT(forecast.costDt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Confiance IA</span>
                <Badge
                  variant={
                    forecast.confidence === "Élevée"
                      ? "success"
                      : forecast.confidence === "Moyenne"
                      ? "warning"
                      : "muted"
                  }
                >
                  {forecast.confidence}
                </Badge>
              </div>
            </div>

            {forecast.risks.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-danger flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" /> Risques détectés
                </p>
                <ul className="space-y-1">
                  {forecast.risks.map((r, i) => (
                    <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                      <span className="text-danger mt-0.5 shrink-0">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <ShieldAlert className="w-4 h-4" /> Carnet de Santé
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-border px-4 py-2">
              <AddTreatment lotId={lot.id} />
            </div>
            {lotTreatments.length > 0 ? (
              <div className="divide-y divide-border">
                {lotTreatments.map((t) => (
                  <TreatmentRow key={t.id} t={t} farm={farm} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Bug className="w-7 h-7 text-muted opacity-40" />
                <p className="text-sm text-muted">Aucun traitement enregistré</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function AddTreatment({ lotId }: { lotId: string }) {
  const farm = useFarmData();
  const [isAdding, setIsAdding] = useState(false);
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [maladie, setMaladie] = useState("");
  const [produit, setProduit] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!maladie.trim() || !produit.trim()) return;
    await farm.actions.addTreatment({
      lotId,
      dateISO,
      maladie: maladie.trim(),
      produit: produit.trim(),
      notes: notes.trim() || undefined,
    });
    setMaladie("");
    setProduit("");
    setNotes("");
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button variant="ghost" className="w-full justify-start text-muted gap-2" onClick={() => setIsAdding(true)}>
        <Plus className="w-4 h-4" /> Ajouter un traitement...
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Maladie / Ravageur" value={maladie} onChange={(e) => setMaladie(e.target.value)} />
        <Input placeholder="Produit utilisé" value={produit} onChange={(e) => setProduit(e.target.value)} />
      </div>
      <Input placeholder="Notes (optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Annuler</Button>
        <Button size="sm" onClick={submit} disabled={!maladie.trim() || !produit.trim()}>Enregistrer</Button>
      </div>
    </div>
  );
}

function TreatmentRow({
  t,
  farm,
}: {
  t: ReturnType<typeof useFarmData>["treatments"][number];
  farm: ReturnType<typeof useFarmData>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dateISO, setDateISO] = useState(t.dateISO);
  const [maladie, setMaladie] = useState(t.maladie);
  const [produit, setProduit] = useState(t.produit);
  const [notes, setNotes] = useState(t.notes || "");

  async function handleSave() {
    if (!maladie.trim() || !produit.trim()) return;
    await farm.actions.updateTreatment(t.id, {
      dateISO,
      maladie: maladie.trim(),
      produit: produit.trim(),
      notes: notes.trim() || undefined,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="p-4 space-y-2 bg-secondary/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Modifier</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={handleSave}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted" onClick={() => setIsEditing(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input value={maladie} onChange={(e) => setMaladie(e.target.value)} />
          <Input value={produit} onChange={(e) => setProduit(e.target.value)} />
        </div>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 group hover:bg-secondary/20 transition-colors">
      <div className="w-7 h-7 rounded-md bg-warning/10 flex items-center justify-center text-warning shrink-0 mt-0.5">
        <ShieldAlert className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{t.maladie}</div>
        <div className="text-xs text-muted mt-0.5">
          {t.dateISO} · {t.produit}
        </div>
        {t.notes && <div className="text-xs text-muted italic mt-0.5">{t.notes}</div>}
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-danger"
          onClick={() => {
            if (confirm("Supprimer ce traitement ?")) farm.actions.removeTreatment(t.id);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
