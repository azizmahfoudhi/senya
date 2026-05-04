"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ageYearsFromISO, batchEstimatedProductionKg, sumExpensesForBatch, estimatedYieldKgPerTree } from "@/lib/engine";
import { computeLotHealth, computeLotForecast } from "@/lib/intelligence";
import { todayISO } from "@/lib/derive";
import { formatDateLong, formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import { Star, ShieldAlert, Bug, Plus, Trash2, Edit2, Check, X, Sprout } from "lucide-react";

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
  const lotAge = ageYearsFromISO(lot.datePlantationISO, tISO);
  const farmState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    tasks: farm.tasks,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };
  const cost = sumExpensesForBatch(farmState, lot.id);
  const prod = type ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO, rainMm: projectedRainMm }) : 0;
  const health = computeLotHealth(farmState, lot.id, projectedRainMm);
  const forecast = computeLotForecast(farmState, lot.id, projectedRainMm);

  const perTreeCost = lot.nbArbres > 0 ? cost / lot.nbArbres : 0;
  const yieldPerTree = lot.nbArbres > 0 ? prod / lot.nbArbres : 0;

  const lotTreatments = farm.treatments.filter(t => t.lotId === lot.id);

  async function handleSave() {
    if (!lot) return;
    if (!editNom.trim() || !editTypeId) return;
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
    <AppShell title={lot.nom}>
      <div className="flex flex-col gap-6">
        
        {/* SECTION: RÉSUMÉ */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-xl">Résumé</CardTitle>
                <CardDescription>
                  {lot.typeId && type ? type.nom : `${type?.nom || "Chemlali"} (Défaut)`} · {formatNumber(lot.nbArbres)} arbres ·{" "}
                  {formatNumber(lotAge, 1)} ans · {lot.irrigation === "optimal" ? "Irrigué (Optimal)" : lot.irrigation === "normal" ? "Irrigué (Normal)" : lot.irrigation === "faible" ? "Irrigué (Faible)" : "Bour (Non irrigué)"}
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
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)} className="shrink-0 gap-2">
                {isEditing ? <><X className="w-4 h-4" /> Annuler</> : <><Edit2 className="w-4 h-4" /> Modifier</>}
              </Button>
            </div>
          </CardHeader>

          {isEditing && (
            <div className="px-6 pb-4 border-b border-border/50 bg-muted/5 grid gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <label className="grid gap-1.5">
                  <div className="text-xs font-medium text-foreground/80">Nom du lot</div>
                  <Input value={editNom} onChange={e => setEditNom(e.target.value)} className="bg-background h-9" />
                </label>
                <label className="grid gap-1.5">
                  <div className="text-xs font-medium text-foreground/80">Variété</div>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={editTypeId}
                    onChange={(e) => setEditTypeId(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {farm.types.map((t) => (
                      <option key={t.id} value={t.id}>{t.nom}</option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1.5">
                  <div className="text-xs font-medium text-foreground/80">Nb Arbres</div>
                  <Input type="number" min="1" value={editNb} onChange={e => setEditNb(e.target.value)} className="bg-background h-9" />
                </label>
                <label className="grid gap-1.5">
                  <div className="text-xs font-medium text-foreground/80">Irrigation</div>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={editIrrig}
                    onChange={(e) => setEditIrrig(e.target.value as any)}
                  >
                    <option value="non_irrigue">Bour</option>
                    <option value="faible">Irrigué (Faible)</option>
                    <option value="normal">Irrigué (Normal)</option>
                    <option value="optimal">Irrigué (Optimal)</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <div className="text-xs font-medium text-foreground/80">Plantation</div>
                  <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-background h-9" />
                </label>
              </div>

              <label className="grid gap-1.5">
                <div className="text-xs font-medium text-foreground/80 flex items-center justify-between">
                  <span>État de production</span>
                  <span className="text-[10px] text-muted">
                    {editCroissance === 1 && "Critique (0.4x)"}
                    {editCroissance === 2 && "Faible (0.7x)"}
                    {editCroissance === 3 && "Normal (1.0x)"}
                    {editCroissance === 4 && "Bon (1.2x)"}
                    {editCroissance === 5 && "Excellent (1.5x)"}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-background/50 p-1.5 rounded-md border border-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditCroissance(star)}
                      className={`p-1 rounded-md transition-colors ${
                        star <= editCroissance ? "text-warning hover:text-warning/80" : "text-muted hover:text-muted/80"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${star <= editCroissance ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
              </label>
              
              <div className="flex justify-end mt-1">
                <Button onClick={handleSave} className="gap-2" size="sm">
                  <Check className="w-4 h-4" /> Enregistrer
                </Button>
              </div>
            </div>
          )}

          <CardContent className="grid grid-cols-2 gap-2 mt-4">
            <Kpi label="Total Dépenses" value={formatMoneyDT(cost)} className="text-danger" />
            <Kpi label="Dépense / arbre" value={formatMoneyDT(perTreeCost)} />
            <Kpi label="Production estimée (Année)" value={formatKg(prod)} />
            <Kpi label="Rendement estimé / arbre" value={`${formatNumber(yieldPerTree, 1)} kg`} />
          </CardContent>
        </Card>



        {/* SECTION: CARNET DE SANTÉ (TRAITEMENTS) */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-warning">
            <ShieldAlert className="w-5 h-5" /> Carnet de Santé
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4 text-center">
              <div className="text-sm font-medium text-muted">Statut</div>
              <div className="font-bold text-lg">{(lot.etatCroissance ?? 0) >= 3 ? "Normal" : "Critique"}</div>
            </Card>
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4 text-center">
              <div className="text-sm font-medium text-muted">Âge</div>
              <div className="font-bold text-lg">{lotAge.toFixed(1)} ans</div>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm mt-6 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full bg-current ${health.colorClass}`} />
            <div className="p-4 pl-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Score de Santé</h3>
                  <p className="text-sm text-muted">Basé sur 4 piliers analytiques</p>
                </div>
                <div className={`text-3xl font-black ${health.colorClass}`}>
                  {health.total}<span className="text-lg opacity-50">/100</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {[
                  { label: "Rendement", val: health.breakdown.yield },
                  { label: "Eau", val: health.breakdown.water },
                  { label: "Finances", val: health.breakdown.financial },
                  { label: "Stress", val: health.breakdown.stress },
                ].map((p, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="h-16 w-full bg-background rounded-full overflow-hidden flex flex-col justify-end border border-border/40">
                      <div className={`w-full transition-all duration-1000 ${p.val < 50 ? 'bg-danger' : p.val < 80 ? 'bg-warning' : 'bg-success'}`} style={{ height: `${p.val}%` }} />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium truncate w-full text-center">{p.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs p-2 bg-background/50 rounded-lg border border-border/40 flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span className="text-muted-foreground">Le point faible actuel est <strong>{health.weakestPillar}</strong>. La résolution de ce point augmentera rapidement le score.</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Prediction Engine Forecast */}
        <div className="flex flex-col gap-4">
          <Card className="border-primary/20 bg-primary/5 p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sprout className="w-24 h-24" />
            </div>
            <h3 className="font-bold text-lg text-primary flex items-center gap-2 mb-4">
              🔮 Prévisions Saison Prochaine
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
              <div>
                <div className="text-sm font-medium text-foreground/70 mb-1">Rendement Prévu</div>
                <div className="text-2xl font-black text-foreground">
                  {formatKg(forecast.yieldKg)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground/70 mb-1">Bénéfice Net Prévu</div>
                <div className={`text-2xl font-black ${forecast.profitDt >= 0 ? "text-success" : "text-danger"}`}>
                  {formatMoneyDT(forecast.profitDt)}
                </div>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coût estimé</span>
                <span className="font-medium text-danger">{formatMoneyDT(forecast.costDt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confiance IA</span>
                <span className="font-medium bg-background px-2 py-0.5 rounded-full border border-border/50 text-xs uppercase tracking-wider">{forecast.confidence}</span>
              </div>
            </div>

            {forecast.risks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-primary/10 relative z-10">
                <div className="text-sm font-semibold mb-2 flex items-center gap-1 text-danger">
                  <ShieldAlert className="w-4 h-4" /> Risques Détectés
                </div>
                <ul className="space-y-1">
                  {forecast.risks.map((r, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-danger mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

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
            <span className="text-muted">{t.dateISO}</span>
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
