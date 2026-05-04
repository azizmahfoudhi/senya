"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useFarmData } from "@/lib/useFarmData";
import { formatDateLong, formatMoneyDT, formatKg } from "@/lib/format";
import { BrainCircuit, Search, Wallet, ShieldAlert, CheckCircle2, Sprout, Plus, Printer, Trash2, Edit2 } from "lucide-react";
import { Select } from "@/components/ui/Select";

type MemoryEvent = {
  id: string;
  dateISO: string;
  type: "expense" | "task" | "treatment" | "yield";
  title: string;
  subtitle?: string;
  lotId?: string;
  lotName?: string;
  amount?: number;
  icon: React.ReactNode;
  colorClass: string;
};

export default function MemoryPage() {
  const farm = useFarmData();
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [isAddYieldOpen, setIsAddYieldOpen] = React.useState(false);

  // Add Yield Form State
  const [selectedLotIds, setSelectedLotIds] = React.useState<Set<string>>(new Set());
  const [yDate, setYDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [yQuantite, setYQuantite] = React.useState("");
  const [yQuantiteVendue, setYQuantiteVendue] = React.useState("");
  const [yPrixVente, setYPrixVente] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<MemoryEvent | null>(null);

  if (farm.loading) return <AppShell title="Mémoire Agricole"><div className="p-8 text-center animate-pulse">Chargement de l'historique...</div></AppShell>;

  // Build Unified Timeline
  const events: MemoryEvent[] = [];

  // 1. Expenses
  farm.depenses.forEach(e => {
    events.push({
      id: `exp-${e.id}`,
      dateISO: e.dateISO,
      type: "expense",
      title: `Dépense : ${e.categorie}`,
      subtitle: e.note || "Aucune note",
      lotId: e.lotId,
      lotName: farm.lots.find(l => l.id === e.lotId)?.nom,
      amount: e.montant,
      icon: <Wallet className="w-4 h-4" />,
      colorClass: "bg-danger/10 text-danger border-danger/20",
    });
  });

  // 2. Treatments
  farm.treatments.forEach(t => {
    events.push({
      id: `trt-${t.id}`,
      dateISO: t.dateISO,
      type: "treatment",
      title: `Traitement : ${t.maladie}`,
      subtitle: t.produit + (t.notes ? ` (${t.notes})` : ""),
      lotId: t.lotId,
      lotName: farm.lots.find(l => l.id === t.lotId)?.nom,
      icon: <ShieldAlert className="w-4 h-4" />,
      colorClass: "bg-warning/10 text-warning-foreground border-warning/20",
    });
  });



  // 4. Yields
  farm.yields.forEach(y => {
    events.push({
      id: `yld-${y.id}`,
      dateISO: y.dateISO,
      type: "yield",
      title: `Récolte enregistrée`,
      subtitle: y.note || "Aucune note",
      lotId: y.lotId,
      lotName: farm.lots.find(l => l.id === y.lotId)?.nom,
      amount: y.quantiteKg, // We will format this as Kg not money
      icon: <Sprout className="w-4 h-4" />,
      colorClass: "bg-success/10 text-success border-success/20",
    });
  });

  // Sort descending by date
  events.sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // Filter
  const filteredEvents = events.filter(e => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchSub = e.subtitle?.toLowerCase().includes(q);
      const matchLot = e.lotName?.toLowerCase().includes(q);
      const matchYear = e.dateISO.includes(q);
      if (!matchTitle && !matchSub && !matchLot && !matchYear) return false;
    }
    return true;
  });

  async function handleAddYield(e: React.FormEvent) {
    e.preventDefault();
    if (selectedLotIds.size === 0 || !yQuantite || !yDate) return;

    setIsSubmitting(true);
    try {
      const totalQuantite = Number(yQuantite);
      const totalVendue = yQuantiteVendue ? Number(yQuantiteVendue) : undefined;
      const unitPrice = yPrixVente ? Number(yPrixVente) : undefined;
      
      if (editingEvent) {
        const id = editingEvent.id.substring(editingEvent.id.indexOf('-') + 1);
        await farm.actions.updateYield(id, {
          quantiteKg: totalQuantite,
          quantiteVendueKg: totalVendue,
          prixVenteUnitaire: unitPrice,
          dateISO: yDate
        });
      } else {
        const selectedLots = farm.lots.filter(l => selectedLotIds.has(l.id));
        const totalTrees = selectedLots.reduce((sum, l) => sum + l.nbArbres, 0);
        
        for (const lot of selectedLots) {
          const proportion = totalTrees > 0 ? (lot.nbArbres / totalTrees) : (1 / selectedLots.length);
          const lotQuantite = Number((totalQuantite * proportion).toFixed(2));
          const lotVendue = totalVendue !== undefined ? Number((totalVendue * proportion).toFixed(2)) : undefined;
          
          await farm.actions.addYield({
            lotId: lot.id,
            dateISO: yDate,
            quantiteKg: lotQuantite,
            quantiteVendueKg: lotVendue,
            prixVenteUnitaire: unitPrice,
          });
        }
      }

      setIsAddYieldOpen(false);
      setEditingEvent(null);
      setSelectedLotIds(new Set());
      setYQuantite("");
      setYQuantiteVendue("");
      setYPrixVente("");
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      alert("Erreur Supabase : " + (err.message || "Impossible d'enregistrer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(e: MemoryEvent) {
    setEditingEvent(e);
    setYQuantite(String(e.amount || ""));
    // We need to find the yield record to get vendue and prix
    const id = e.id.substring(e.id.indexOf('-') + 1);
    const yr = farm.yields.find(y => y.id === id);
    if (yr) {
      setYQuantiteVendue(String(yr.quantiteVendueKg || ""));
      setYPrixVente(String(yr.prixVenteUnitaire || ""));
    }
    setYDate(e.dateISO);
    if (e.lotId) setSelectedLotIds(new Set([e.lotId]));
    setIsAddYieldOpen(true);
  }

  async function handleDeleteEvent(e: MemoryEvent) {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
    
    try {
      const id = e.id.substring(e.id.indexOf('-') + 1);
      if (e.type === "yield") {
        await farm.actions.removeYield(id);
      } else if (e.type === "expense") {
        await farm.actions.removeExpense(id);
      } else if (e.type === "treatment") {
        await farm.actions.removeTreatment(id);
      }
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  }

  return (
    <AppShell 
      title="Mémoire Agricole"
      actions={
        <Button size="sm" variant="secondary" className="gap-2 print:hidden rounded-xl shadow-lg font-bold uppercase tracking-widest text-[10px]" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Exporter
        </Button>
      }
    >
      <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
        
        {/* HEADER */}
        <div className="px-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Mémoire de la Ferme
            </h1>
            <p className="text-muted-foreground font-medium pt-1 max-w-md text-lg">Le grand livre d'histoire de votre exploitation. Archivez chaque action pour nourrir l'intelligence de demain.</p>
          </div>
          
          <Button size="lg" className="gap-2 bg-primary shadow-xl shadow-primary/20 rounded-2xl font-black uppercase tracking-widest text-[10px] h-14 px-8 print:hidden" onClick={() => setIsAddYieldOpen(true)}>
            <Plus className="w-5 h-5" />
            Saisir Récolte
          </Button>

          {/* Native Modal for Add Yield */}
          {isAddYieldOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-card w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-border/40 relative animate-in zoom-in-95 duration-500 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                <h2 className="text-2xl font-black tracking-tighter mb-6">{editingEvent ? "Modifier la récolte" : "Enregistrer une récolte"}</h2>
                <form onSubmit={handleAddYield} className="space-y-6">
                  {!editingEvent && (
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Affectation (Répartition auto)</div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {farm.lots.map(l => {
                          const isSelected = selectedLotIds.has(l.id);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                const next = new Set(selectedLotIds);
                                if (next.has(l.id)) next.delete(l.id);
                                else next.add(l.id);
                                setSelectedLotIds(next);
                              }}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-background hover:bg-muted border-border/40 text-muted-foreground'}`}
                            >
                              {l.nom}
                            </button>
                          );
                        })}
                      </div>
                      {selectedLotIds.size === 0 && <div className="text-[10px] font-bold text-danger animate-pulse">SÉLECTIONNEZ UN LOT</div>}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date de récolte</div>
                    <Input type="date" value={yDate} onChange={e => setYDate(e.target.value)} required className="h-12 rounded-xl bg-muted/5 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantité Totale (kg)</div>
                    <Input type="number" min="0" value={yQuantite} onChange={e => setYQuantite(e.target.value)} required placeholder="Ex: 1200" className="h-12 rounded-xl bg-muted/5 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qté Vendue (kg)</div>
                      <Input type="number" min="0" value={yQuantiteVendue} onChange={e => setYQuantiteVendue(e.target.value)} placeholder="Optionnel" className="h-12 rounded-xl bg-muted/5 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prix (DT/kg)</div>
                      <Input type="number" step="0.001" min="0" value={yPrixVente} onChange={e => setYPrixVente(e.target.value)} placeholder="Optionnel" className="h-12 rounded-xl bg-muted/5 font-bold" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={() => { setIsAddYieldOpen(false); setEditingEvent(null); }} disabled={isSubmitting}>Annuler</Button>
                    <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20" disabled={isSubmitting || (!editingEvent && selectedLotIds.size === 0)}>
                      {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4 px-2 print:hidden">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Rechercher par lot, année, ou type d'événement..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-muted/5 border-border/40 focus:bg-background transition-all font-medium text-lg"
            />
          </div>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            className="h-14 w-full sm:w-[220px] rounded-2xl border border-border/40 bg-muted/5 px-4 py-2 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
          >
            <option value="all">Tout l'Historique</option>
            <option value="yield">Récoltes</option>
            <option value="expense">Dépenses</option>
            <option value="treatment">Traitements</option>
          </select>
        </div>

        {/* TIMELINE */}
        <div className="relative ml-8 border-l-2 border-dashed border-border/60 space-y-10 pb-20">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/40">
              <div className="text-4xl mb-4 opacity-20">📂</div>
              <div className="text-sm font-black uppercase tracking-widest text-muted">Aucune archive trouvée</div>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={event.id} className="relative pl-10 animate-in fade-in slide-in-from-left-6 fill-mode-both group" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-[17px] top-4 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-125 z-10",
                  event.colorClass
                )}>
                  {event.icon}
                </div>
                
                <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-xl shadow-black/5 group-hover:shadow-primary/5 group-hover:border-primary/20 transition-all duration-500 overflow-hidden group-hover:-translate-y-1">
                  <div className="p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 px-3 py-1 rounded-full border border-border/20">
                          {formatDateLong(event.dateISO)}
                        </span>
                        {event.lotName && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            {event.lotName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black tracking-tighter leading-tight">{event.title}</h3>
                      {event.subtitle && <p className="text-sm font-medium text-muted-foreground italic">{event.subtitle}</p>}
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                      {event.amount !== undefined && (
                        <div className={`text-3xl font-black tracking-tighter tabular-nums ${event.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                          {event.type === 'expense' ? `-${formatMoneyDT(event.amount)}` : `+${formatKg(event.amount)}`}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        {event.type === "yield" && (
                          <button 
                            onClick={() => openEditModal(event)}
                            className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteEvent(event)}
                          className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all shadow-lg shadow-danger/10"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>

      </div>
    </AppShell>
  );
}
>

      </div>
    </AppShell>
  );
}
