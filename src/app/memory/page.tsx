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
      
      if (editingEvent) {
        const id = editingEvent.id.split("-")[1];
        await farm.actions.updateYield(id, {
          quantiteKg: totalQuantite,
          dateISO: yDate
        });
      } else {
        const selectedLots = farm.lots.filter(l => selectedLotIds.has(l.id));
        const totalTrees = selectedLots.reduce((sum, l) => sum + l.nbArbres, 0);
        
        for (const lot of selectedLots) {
          const proportion = totalTrees > 0 ? (lot.nbArbres / totalTrees) : (1 / selectedLots.length);
          const lotQuantite = Number((totalQuantite * proportion).toFixed(2));
          
          await farm.actions.addYield({
            lotId: lot.id,
            dateISO: yDate,
            quantiteKg: lotQuantite,
          });
        }
      }

      setIsAddYieldOpen(false);
      setEditingEvent(null);
      setSelectedLotIds(new Set());
      setYQuantite("");
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
    setYDate(e.dateISO);
    if (e.lotId) setSelectedLotIds(new Set([e.lotId]));
    setIsAddYieldOpen(true);
  }

  async function handleDeleteEvent(e: MemoryEvent) {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
    
    try {
      const id = e.id.split("-")[1];
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
        <Button size="sm" variant="secondary" className="gap-2 print:hidden" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Exporter PDF</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER & SEARCH */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-primary" />
                Mémoire de la Ferme
              </h1>
              <p className="text-sm text-muted">Historique complet des événements, actions et rendements.</p>
            </div>
            
            <Button size="sm" className="gap-2 bg-success hover:bg-success/90 text-success-foreground print:hidden" onClick={() => setIsAddYieldOpen(true)}>
              <Plus className="w-4 h-4" />
              Saisir Récolte
            </Button>
            
            {/* Native Modal for Add Yield */}
            {isAddYieldOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border border-border/50 relative animate-in zoom-in-95 duration-200">
                  <h2 className="text-xl font-bold mb-4">{editingEvent ? "Modifier la récolte" : "Enregistrer une récolte"}</h2>
                  <form onSubmit={handleAddYield} className="space-y-4">
                    {!editingEvent && (
                      <div className="space-y-1.5">
                      <label className="text-sm font-medium">Lier à un/des lot(s) (Répartition proportionnelle)</label>
                      <div className="flex flex-wrap gap-2">
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
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border/60 text-muted-foreground'}`}
                            >
                              {l.nom}
                            </button>
                          );
                        })}
                      </div>
                      {selectedLotIds.size === 0 && <div className="text-xs text-danger mt-1">Veuillez sélectionner au moins un lot</div>}
                      {selectedLotIds.size > 1 && <div className="text-xs text-primary font-medium mt-1">Répartition automatique entre {selectedLotIds.size} lots</div>}
                    </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Date / Année</label>
                      <Input type="date" value={yDate} onChange={e => setYDate(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Quantité totale (kg)</label>
                      <Input type="number" min="0" value={yQuantite} onChange={e => setYQuantite(e.target.value)} required placeholder="Ex: 1200" />
                    </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => { setIsAddYieldOpen(false); setEditingEvent(null); }} disabled={isSubmitting}>Annuler</Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting || (!editingEvent && selectedLotIds.size === 0)}>
                          {isSubmitting ? "Envoi..." : editingEvent ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                      </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input 
                placeholder="Rechercher (ex: 'Taille 2024', 'Lot A', 'Canicule'...)" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full sm:w-[180px] bg-card/50">
              <option value="all">Tous les événements</option>
              <option value="yield">🌾 Récoltes & Rendements</option>
              <option value="expense">💸 Dépenses</option>
              <option value="treatment">🐛 Traitements</option>
            </Select>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="relative border-l-2 border-border/40 ml-4 pl-6 space-y-6 pb-12">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted">
              Aucun événement ne correspond à votre recherche.
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={event.id} className="relative group animate-in fade-in slide-in-from-left-4 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Timeline Dot */}
                <div className={`absolute -left-[35px] w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${event.colorClass} shadow-sm transition-transform group-hover:scale-110`}>
                  {event.icon}
                </div>
                
                <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-sm group-hover:shadow-md transition-all group-hover:border-primary/20 overflow-hidden">
                  <div className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{formatDateLong(event.dateISO)}</span>
                        {event.lotName && (
                          <span className="text-[10px] bg-background/80 px-2 py-0.5 rounded-full border border-border/40 text-foreground/80 font-medium">
                            {event.lotName}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-base">{event.title}</h3>
                      {event.subtitle && <p className="text-sm text-muted mt-0.5">{event.subtitle}</p>}
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      {event.amount !== undefined && (
                        <div className={`text-lg font-black ${event.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                          {event.type === 'expense' ? `-${formatMoneyDT(event.amount)}` : `+${formatKg(event.amount)}`}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {event.type === "yield" && (
                          <button 
                            onClick={() => openEditModal(event)}
                            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteEvent(event)}
                          className="p-2 rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
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
