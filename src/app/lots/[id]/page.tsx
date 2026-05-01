"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ageYearsFromISO, batchActualROI, batchEstimatedProductionKg, sumExpensesForBatch, sumRevenuesForBatch } from "@/lib/engine";
import { todayISO } from "@/lib/derive";
import { formatDateLong, formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { Star, ShieldAlert, Bug, Plus, Trash2, Edit2, Check, X } from "lucide-react";

export default function LotDetailPage() {
  const farm = useFarmData();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const lot = farm.lots.find((l) => l.id === id);
  const typeById = useMemo(() => new Map(farm.types.map((t) => [t.id, t])), [farm.types]);
  const tISO = todayISO();

  if (!lot) {
    return (
      <AppShell title="Lot">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lot introuvable</CardTitle>
              <CardDescription>Revenez à la liste des lots.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  const type = typeById.get(lot.typeId);
  const age = ageYearsFromISO(lot.datePlantationISO, tISO);
  const farmState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    harvests: farm.harvests,
    tasks: farm.tasks,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };
  const cost = sumExpensesForBatch(farmState, lot.id);
  const rev = sumRevenuesForBatch(farmState, lot.id);
  const roi = batchActualROI(farmState, lot.id);
  const isProfitable = roi >= 0;

  const prod = type ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO }) : 0;
  const perTreeCost = lot.nbArbres > 0 ? cost / lot.nbArbres : 0;
  const yieldPerTree = lot.nbArbres > 0 ? prod / lot.nbArbres : 0;

  const lotHarvests = farm.harvests.filter(h => h.lotId === lot.id);
  const lotTreatments = farm.treatments.filter(t => t.lotId === lot.id);

  return (
    <AppShell title={lot.nom}>
      <div className="flex flex-col gap-6">
        
        {/* SECTION: RÉSUMÉ & ROI */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-xl">Résumé & ROI</CardTitle>
                <CardDescription>
                  {type?.nom ?? "Type inconnu"} · {formatNumber(lot.nbArbres)} arbres ·{" "}
                  {formatNumber(age, 1)} ans · {lot.irrigation === "irrigue" ? "Irrigué" : "Non irrigué"}
                  {lot.etatCroissance !== 3 && (
                    <>
                      {" "}·{" "}
                      <span className="inline-flex items-center gap-0.5 align-middle" title="État de croissance">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= (lot.etatCroissance ?? 3) ? "text-warning fill-current" : "text-muted"}`}
                          />
                        ))}
                      </span>
                    </>
                  )}
                </CardDescription>
              </div>
              <div className={`px-3 py-1.5 rounded-xl border ${isProfitable ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"} text-center`}>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">ROI Actuel</div>
                <div className="font-black text-lg leading-none">{roi > 0 ? "+" : ""}{formatMoneyDT(roi)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Kpi label="Total Dépenses" value={formatMoneyDT(cost)} className="text-danger" />
            <Kpi label="Total Revenus" value={formatMoneyDT(rev)} className="text-success" />
            <Kpi label="Production estimée (Année)" value={formatKg(prod)} />
            <Kpi label="Rendement estimé / arbre" value={`${formatNumber(yieldPerTree, 1)} kg`} />
          </CardContent>
        </Card>

        {/* SECTION: RÉCOLTES DU LOT */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            🌾 Historique des Récoltes
          </h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
            <CardContent className="p-3 grid gap-2">
              {lotHarvests.length > 0 ? (
                lotHarvests.map(h => (
                  <div key={h.id} className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/40">
                    <div>
                      <div className="font-bold">{formatKg(h.quantiteKg)}</div>
                      <div className="text-xs text-muted">{formatDateLong(h.dateISO)}</div>
                    </div>
                    <div className="text-right">
                      {h.revenuGenere ? <div className="font-bold text-success">+{formatMoneyDT(h.revenuGenere)}</div> : null}
                      {h.rendementHuilePct ? <div className="text-xs text-muted">{h.rendementHuilePct}% huile</div> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted text-center py-4">Aucune récolte enregistrée pour ce lot.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SECTION: CARNET DE SANTÉ (TRAITEMENTS) */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-warning">
            <ShieldAlert className="w-5 h-5" /> Carnet de Santé
          </h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm mb-4">
            <CardContent className="p-2">
              <AddTreatment lotId={lot.id} />
            </CardContent>
          </Card>
          <div className="grid gap-2">
            {lotTreatments.length > 0 ? (
              lotTreatments.map(t => <TreatmentRow key={t.id} t={t} farm={farm} />)
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-xl bg-muted/5">
                <Bug className="w-8 h-8 text-muted mb-2 opacity-50" />
                <div className="text-sm font-medium">Aucun traitement</div>
                <div className="text-xs text-muted">Ce lot n'a reçu aucun traitement phytosanitaire.</div>
              </div>
            )}
          </div>
        </div>

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
      <Button variant="ghost" className="w-full text-muted justify-start" onClick={() => setIsAdding(true)}>
        <Plus className="w-4 h-4 mr-2" /> Ajouter un traitement...
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2 animate-in fade-in zoom-in-95">
      <Input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className="bg-background" />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Maladie / Ravageur..." value={maladie} onChange={e => setMaladie(e.target.value)} className="bg-background" />
        <Input placeholder="Produit utilisé..." value={produit} onChange={e => setProduit(e.target.value)} className="bg-background" />
      </div>
      <Input placeholder="Notes (Optionnel)..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background" />
      <div className="flex justify-end gap-2 mt-1">
        <Button variant="ghost" onClick={() => setIsAdding(false)}>Annuler</Button>
        <Button onClick={submit} disabled={!maladie.trim() || !produit.trim()}>Enregistrer</Button>
      </div>
    </div>
  );
}

function TreatmentRow({ t, farm }: { t: any; farm: ReturnType<typeof useFarmData> }) {
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
      <Card className="border-warning/50 bg-warning/5 animate-in fade-in zoom-in-95">
        <CardContent className="p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">Modifier traitement</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" onClick={handleSave}><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <Input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className="h-8 bg-background" />
          <div className="grid grid-cols-2 gap-2">
             <Input value={maladie} onChange={e => setMaladie(e.target.value)} className="h-8 bg-background" />
             <Input value={produit} onChange={e => setProduit(e.target.value)} className="h-8 bg-background" />
          </div>
          <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-8 bg-background" placeholder="Notes..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group border-border/40 hover:border-warning/50 transition-colors bg-card/50 backdrop-blur-xl shadow-sm">
      <CardContent className="p-3 flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{t.maladie}</div>
          <div className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-muted">{formatDateLong(t.dateISO)}</span>
            <span className="text-muted">•</span>
            <span className="text-foreground/80 font-medium">Produit: {t.produit}</span>
          </div>
          {t.notes && <div className="text-xs text-muted/80 mt-1 italic">{t.notes}</div>}
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => farm.actions.removeTreatment(t.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, className = "" }: { label: string; value: string, className?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
      <div className="text-xs text-muted font-medium mb-1">{label}</div>
      <div className={`text-base font-bold ${className}`}>{value}</div>
    </div>
  );
}
