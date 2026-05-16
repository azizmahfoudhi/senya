"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { useFarmData } from "@/lib/useFarmData";
import { formatMoneyDT } from "@/lib/format";
import { CheckCircle2, Trees, Trash2, Sprout, Edit2, X, Check, Star, Settings, DollarSign, Map, Plus, BrainCircuit } from "lucide-react";
import { computeLotHealth, computeLotForecast } from "@/lib/intelligence";

export default function StructurePage() {
  const farm = useFarmData();
  const [isAddingLot, setIsAddingLot] = React.useState(false);
  const [editingTypeId, setEditingTypeId] = React.useState<string | null>(null);
  const [editMaxYield, setEditMaxYield] = React.useState("");

  async function calibrateIA() {
    if (!confirm("Voulez-vous mettre à jour vos modèles botaniques selon les derniers standards scientifiques (Chemlali 60kg, Koroneiki 45kg) ?")) return;
    for (const t of farm.types) {
      if (t.nom.toLowerCase().includes("chemlali")) await farm.actions.updateTreeType(t.id, { rendementMaxKgParArbre: 60 });
      if (t.nom.toLowerCase().includes("koroneiki")) await farm.actions.updateTreeType(t.id, { rendementMaxKgParArbre: 45 });
    }
    alert("IA Calibrée !");
  }

  // Varieties Performance Pivot Logic
  const varietiesAnalysis = farm.types.map(type => {
    const typeLots = farm.lots.filter(l => l.typeId === type.id);
    const totalTrees = typeLots.reduce((sum, l) => sum + l.nbArbres, 0);
    
    let avgHealth = 0;
    let avgYieldPillar = 0;
    let totalActualYield = 0;
    
    if (typeLots.length > 0) {
      typeLots.forEach(l => {
        const h = computeLotHealth(farm, l.id);
        const f = computeLotForecast(farm, l.id);
        avgHealth += h.total * l.nbArbres;
        avgYieldPillar += h.breakdown.yield * l.nbArbres;
        totalActualYield += f.yieldKg;
      });
      avgHealth /= totalTrees;
      avgYieldPillar /= totalTrees;
    }
    
    return {
      ...type,
      totalTrees,
      avgHealth,
      avgYieldPillar,
      actualYieldPerTree: totalTrees > 0 ? totalActualYield / totalTrees : 0
    };
  });

  if (farm.loading) return <AppShell title="Structure"><div className="p-8 text-center animate-pulse">Chargement de la configuration...</div></AppShell>;

  return (
    <AppShell title="Configuration & Structure">
      <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
        
        <div className="px-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Architecture de la Ferme
            </h1>
            <p className="text-muted-foreground font-medium pt-1 max-w-xl text-lg">Définissez vos modèles biologiques et gérez l'infrastructure de vos parcelles.</p>
          </div>
        </div>

        {/* PERFORMANCE PIVOT */}
        <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-2xl overflow-hidden">
          <CardHeader className="bg-muted/5 border-b border-border/40 p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tighter">Pivot de Rendement Variétal</CardTitle>
                <CardDescription className="font-medium italic">Automatisation basée sur les piliers de conditions (Eau, Botanique, Climat).</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={calibrateIA}
                  className="rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 border border-primary/20 hover:bg-primary/10 text-primary h-8 px-3 transition-all"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Calibrer Standards
                </Button>
                <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 h-8">
                  <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                  IA Active
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/10">
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">Modèle</th>
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 text-center">Arbres</th>
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">Plafond (Max)</th>
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">Indice Pilier</th>
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">Potentiel Réel</th>
                    <th className="p-4 sm:p-6 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {varietiesAnalysis.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/5 transition-colors group">
                      <td className="p-4 sm:p-6 border-b border-border/40">
                        <div className="font-bold text-lg">{v.nom}</div>
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{v.isIntensive ? "Système Intensif" : "Traditionnel"}</div>
                      </td>
                      <td className="p-4 sm:p-6 border-b border-border/40 text-center font-bold">
                        {v.totalTrees}
                      </td>
                      <td className="p-4 sm:p-6 border-b border-border/40 font-bold text-muted-foreground italic">
                        {v.rendementMaxKgParArbre} kg/arbre
                      </td>
                      <td className="p-4 sm:p-6 border-b border-border/40">
                        <div className="flex items-center gap-4 w-48">
                           <div className="flex-1 h-2.5 bg-muted/20 rounded-full overflow-hidden p-[1px]">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]", 
                                  v.avgHealth > 70 ? "bg-gradient-to-r from-emerald-500 to-success" : v.avgHealth > 40 ? "bg-gradient-to-r from-amber-400 to-warning" : "bg-gradient-to-r from-red-500 to-danger"
                                )} 
                                style={{ width: `${v.avgHealth}%` }} 
                              />
                           </div>
                           <span className="text-sm font-bold tabular-nums tracking-tighter">{Math.round(v.avgHealth)}%</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 border-b border-border/40">
                        <div className="flex flex-col">
                          <div className="text-xl font-bold text-primary tabular-nums tracking-tighter">
                            {v.totalTrees > 0 ? (Math.round(v.actualYieldPerTree * 10) / 10).toFixed(1) : "—"} <span className="text-xs uppercase ml-0.5">{v.totalTrees > 0 ? "kg/arbre" : ""}</span>
                          </div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Projection IA Actuelle</div>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 border-b border-border/40">
                        <div className="flex flex-wrap gap-2">
                           {v.totalTrees === 0 ? (
                              <span className="bg-muted/10 text-muted-foreground text-[10px] font-bold px-3 py-1.5 rounded-xl border border-border/20 uppercase tracking-widest">Inactif</span>
                           ) : v.avgHealth > 75 ? (
                             <span className="bg-success/10 text-success text-[10px] font-bold px-3 py-1.5 rounded-xl border border-success/20 uppercase tracking-widest shadow-sm shadow-success/5">Optimisé</span>
                           ) : v.avgHealth > 50 ? (
                             <span className="bg-warning/10 text-warning text-[10px] font-bold px-3 py-1.5 rounded-xl border border-warning/20 uppercase tracking-widest shadow-sm shadow-warning/5">A surveiller</span>
                           ) : (
                             <span className="bg-danger/10 text-danger text-[10px] font-bold px-3 py-1.5 rounded-xl border border-danger/20 uppercase tracking-widest shadow-sm shadow-danger/5 whitespace-nowrap">Stress Critique</span>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8">
            <SettingsCard farm={farm} />
            
            {/* BOTANICAL MODELS */}
            <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-2xl relative overflow-hidden group">
              <CardHeader className="bg-muted/5 border-b border-border/40 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tighter">Modèles Botaniques</CardTitle>
                    <CardDescription className="font-medium">Profils de production théoriques.</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:rotate-12 transition-transform duration-500">
                    <Trees className="w-6 h-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {farm.types.map((type) => (
                    <div key={type.id} className="p-4 rounded-2xl border border-border/40 bg-muted/5 hover:bg-background transition-all group/item">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold tracking-tight">{type.nom}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              {type.isIntensive ? "Système Intensif" : "Système Traditionnel"} •
                            </span>
                            {editingTypeId === type.id ? (
                              <div className="flex items-center gap-1 animate-in zoom-in-95">
                                <Input 
                                  className="h-7 w-16 text-xs font-bold px-2 rounded-lg" 
                                  value={editMaxYield} 
                                  onChange={e => setEditMaxYield(e.target.value)}
                                  autoFocus
                                />
                                <button onClick={() => {
                                  farm.actions.updateTreeType(type.id, { rendementMaxKgParArbre: Number(editMaxYield) });
                                  setEditingTypeId(null);
                                }} className="p-1 text-success hover:bg-success/10 rounded-md">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingTypeId(null)} className="p-1 text-danger hover:bg-danger/10 rounded-md">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingTypeId(type.id);
                                  setEditMaxYield(String(type.rendementMaxKgParArbre));
                                }}
                                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1 group/edit"
                              >
                                Max {type.rendementMaxKgParArbre}kg/arbre
                                <Edit2 className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {Math.round(varietiesAnalysis.find(v => v.id === type.id)?.avgHealth || 0)}%
                          </div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Santé Moy.</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <CreateBatchCard farm={farm} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [saving, setSaving] = React.useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async (patch: any) => {
    setSaving("saving");
    await farm.actions.setSettings(patch);
    setSaving("saved");
    setTimeout(() => setSaving("idle"), 2000);
  };

  return (
    <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-xl overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 pointer-events-none">
        <Settings className="w-32 h-32" />
      </div>
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tighter">Configuration Globale</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dimensions et économie de l'exploitation</CardDescription>
            </div>
          </div>
          {saving === "saved" && (
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-right-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 grid sm:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
            <Map className="w-3 h-3" /> Surface Totale
          </div>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="h-14 rounded-2xl bg-background/40 border-border/40 focus:bg-background/60 transition-all pr-12 text-lg font-bold"
              defaultValue={String(farm.settings.surfaceHa ?? 0)}
              onBlur={(e) => handleSave({ surfaceHa: Number(e.target.value || 0) })}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted uppercase tracking-tighter">ha</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Prix de Vente (Moy.)
          </div>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="h-14 rounded-2xl bg-background/40 border-border/40 focus:bg-background/60 transition-all pr-12 text-lg font-bold"
              defaultValue={String(farm.settings.prixKgOlives ?? 0)}
              onBlur={(e) => handleSave({ prixKgOlives: Number(e.target.value || 0) })}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted uppercase tracking-tighter">DT/kg</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBatchCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [nom, setNom] = React.useState("Lot A");
  const [typeId, setTypeId] = React.useState<string>("");
  const [datePlantation, setDatePlantation] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [nb, setNb] = React.useState<string>("100");
  const [irrig, setIrrig] = React.useState<"non_irrigue" | "faible" | "normal" | "optimal">("non_irrigue");
  const [croissance, setCroissance] = React.useState<number>(3);
  const [stress, setStress] = React.useState<"bas" | "moyen" | "eleve">("bas");

  async function submit() {
    const chosen = typeId || farm.types[0]?.id;
    if (!chosen) return;
    await farm.actions.addBatch({
      nom: nom.trim() || "Lot",
      typeId: chosen,
      datePlantationISO: datePlantation,
      nbArbres: Math.max(1, Number(nb || 0)),
      irrigation: irrig,
      etatCroissance: croissance,
      stressLevel: stress,
    });
    setNom("Nouveau lot");
    setNb("100");
  }

  return (
    <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scanning" />
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/20">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tighter">Nouveau Lot</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Extension du patrimoine</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 grid gap-6">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Identifiant</div>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du lot" className="h-12 rounded-xl bg-background/50 border-border/40 font-bold" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Plantation</div>
            <Input type="date" value={datePlantation} onChange={(e) => setDatePlantation(e.target.value)} className="h-12 rounded-xl bg-background/50 border-border/40 font-bold" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Population</div>
            <Input inputMode="numeric" min="1" value={nb} onChange={(e) => setNb(e.target.value)} className="h-12 rounded-xl bg-background/50 border-border/40 font-bold" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Variété</div>
            <select
              className="h-12 w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {farm.types.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Régime</div>
            <select
              className="h-12 w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={irrig}
              onChange={(e) => setIrrig(e.target.value as any)}
            >
              <option value="non_irrigue">Bour (Sec)</option>
              <option value="faible">Irrigué (Faible)</option>
              <option value="normal">Irrigué (Normal)</option>
              <option value="optimal">Irrigué (Optimal)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center justify-between">
            <span>Évaluation Vigueur</span>
            <span className="text-primary font-bold">{(croissance * 20)}%</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-background/30 p-4 rounded-2xl border border-border/20">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCroissance(star)}
                className={`transition-all duration-300 ${star <= croissance ? "text-warning scale-110 drop-shadow-sm" : "text-muted/30 hover:text-muted/60"}`}
              >
                <Star className={`w-8 h-8 ${star <= croissance ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>
        </div>
        
        <Button onClick={submit} disabled={farm.types.length === 0} className="w-full h-14 rounded-2xl shadow-xl shadow-success/20 font-bold uppercase tracking-widest text-xs mt-2">
          Créer le lot
        </Button>
      </CardContent>
    </Card>
  );
}
