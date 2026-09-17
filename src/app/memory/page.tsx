"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useFarmData } from "@/lib/useFarmData";
import { formatMoneyDT, formatKg } from "@/lib/format";
import {
  Printer,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Sprout,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type MemoryEvent = {
  id: string;
  dateISO: string;
  type: "expense" | "treatment" | "yield";
  title: string;
  subtitle?: string;
  lotId?: string;
  lotName?: string;
  amount?: number;
};

export default function MemoryPage() {
  const farm = useFarmData();
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [isAddYieldOpen, setIsAddYieldOpen] = React.useState(false);

  // Add Yield form state
  const [selectedLotIds, setSelectedLotIds] = React.useState<Set<string>>(new Set());
  const [yDate, setYDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [yQuantite, setYQuantite] = React.useState("");
  const [yQuantiteVendue, setYQuantiteVendue] = React.useState("");
  const [yPrixVente, setYPrixVente] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<MemoryEvent | null>(null);

  if (farm.loading) {
    return (
      <AppShell title="Mémoire Agricole">
        <p className="text-sm text-muted animate-pulse">Chargement de l'historique...</p>
      </AppShell>
    );
  }

  // Build unified timeline
  const events: MemoryEvent[] = [
    ...farm.depenses.map((e) => ({
      id: `exp-${e.id}`,
      dateISO: e.dateISO,
      type: "expense" as const,
      title: `Dépense : ${e.categorie}`,
      subtitle: e.note || undefined,
      lotId: e.lotId,
      lotName: farm.lots.find((l) => l.id === e.lotId)?.nom,
      amount: e.montant,
    })),
    ...farm.treatments.map((t) => ({
      id: `trt-${t.id}`,
      dateISO: t.dateISO,
      type: "treatment" as const,
      title: `Traitement : ${t.maladie}`,
      subtitle: t.produit + (t.notes ? ` (${t.notes})` : ""),
      lotId: t.lotId,
      lotName: farm.lots.find((l) => l.id === t.lotId)?.nom,
    })),
    ...farm.yields.map((y) => ({
      id: `yld-${y.id}`,
      dateISO: y.dateISO,
      type: "yield" as const,
      title: "Récolte enregistrée",
      subtitle: y.note || undefined,
      lotId: y.lotId,
      lotName: farm.lots.find((l) => l.id === y.lotId)?.nom,
      amount: y.quantiteKg,
    })),
  ].sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const filteredEvents = events.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !e.subtitle?.toLowerCase().includes(q) &&
        !e.lotName?.toLowerCase().includes(q) &&
        !e.dateISO.includes(q)
      )
        return false;
    }
    return true;
  });

  async function handleAddYield(ev: React.FormEvent) {
    ev.preventDefault();
    if (selectedLotIds.size === 0 || !yQuantite || !yDate) return;
    setIsSubmitting(true);
    try {
      const totalQuantite = Number(yQuantite);
      const totalVendue = yQuantiteVendue ? Number(yQuantiteVendue) : undefined;
      const unitPrice = yPrixVente ? Number(yPrixVente) : undefined;

      if (editingEvent) {
        const id = editingEvent.id.slice(editingEvent.id.indexOf("-") + 1);
        await farm.actions.updateYield(id, {
          quantiteKg: totalQuantite,
          quantiteVendueKg: totalVendue,
          prixVenteUnitaire: unitPrice,
          dateISO: yDate,
        });
      } else {
        const selectedLots = farm.lots.filter((l) => selectedLotIds.has(l.id));
        const totalTrees = selectedLots.reduce((sum, l) => sum + l.nbArbres, 0);
        for (const lot of selectedLots) {
          const prop = totalTrees > 0 ? lot.nbArbres / totalTrees : 1 / selectedLots.length;
          await farm.actions.addYield({
            lotId: lot.id,
            dateISO: yDate,
            quantiteKg: Number((totalQuantite * prop).toFixed(2)),
            quantiteVendueKg: totalVendue
              ? Number((totalVendue * prop).toFixed(2))
              : undefined,
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
    } catch (err: unknown) {
      alert(
        "Erreur : " + (err instanceof Error ? err.message : "Impossible d'enregistrer.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(e: MemoryEvent) {
    setEditingEvent(e);
    setYQuantite(String(e.amount || ""));
    const id = e.id.slice(e.id.indexOf("-") + 1);
    const yr = farm.yields.find((y) => y.id === id);
    if (yr) {
      setYQuantiteVendue(String(yr.quantiteVendueKg || ""));
      setYPrixVente(String(yr.prixVenteUnitaire || ""));
    }
    setYDate(e.dateISO);
    if (e.lotId) setSelectedLotIds(new Set([e.lotId]));
    setIsAddYieldOpen(true);
  }

  async function handleDelete(e: MemoryEvent) {
    if (!confirm("Supprimer cet événement ?")) return;
    const id = e.id.slice(e.id.indexOf("-") + 1);
    if (e.type === "yield") await farm.actions.removeYield(id);
    else if (e.type === "expense") await farm.actions.removeExpense(id);
    else if (e.type === "treatment") await farm.actions.removeTreatment(id);
  }

  const typeConfig = {
    expense: {
      icon: <Wallet className="w-3.5 h-3.5" />,
      badge: "danger" as const,
      label: "Dépense",
    },
    treatment: {
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      badge: "warning" as const,
      label: "Traitement",
    },
    yield: {
      icon: <Sprout className="w-3.5 h-3.5" />,
      badge: "success" as const,
      label: "Récolte",
    },
  };

  return (
    <AppShell
      title="Mémoire Agricole"
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 print:hidden"
            onClick={() => { setEditingEvent(null); setIsAddYieldOpen(true); }}
          >
            <Plus className="w-3.5 h-3.5" />
            Récolte
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search + filter */}
        <div className="flex gap-2 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Rechercher par lot, date, événement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-40"
          >
            <option value="all">Tout l'historique</option>
            <option value="yield">Récoltes</option>
            <option value="expense">Dépenses</option>
            <option value="treatment">Traitements</option>
          </Select>
        </div>

        {/* Timeline */}
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-lg border border-dashed border-border text-center">
            <span className="text-3xl opacity-30">📂</span>
            <p className="text-sm text-muted">Aucune archive trouvée</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
            {filteredEvents.map((event) => {
              const cfg = typeConfig[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 group transition-colors"
                >
                  {/* Type dot */}
                  <div className="mt-0.5 shrink-0">
                    <Badge variant={cfg.badge} className="gap-1">
                      {cfg.icon}
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{event.title}</div>
                        {event.subtitle && (
                          <div className="text-xs text-muted mt-0.5 line-clamp-1">
                            {event.subtitle}
                          </div>
                        )}
                      </div>
                      {event.amount !== undefined && (
                        <span
                          className={cn(
                            "font-bold text-sm shrink-0",
                            event.type === "expense" ? "text-danger" : "text-success"
                          )}
                        >
                          {event.type === "expense"
                            ? `-${formatMoneyDT(event.amount)}`
                            : `+${formatKg(event.amount)}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted">
                        {new Date(event.dateISO).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {event.lotName && (
                        <Badge variant="primary" className="text-[9px]">
                          {event.lotName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {event.type === "yield" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted"
                        onClick={() => openEditModal(event)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-danger"
                      onClick={() => handleDelete(event)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Yield modal */}
      {isAddYieldOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddYieldOpen(false);
              setEditingEvent(null);
            }
          }}
        >
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editingEvent ? "Modifier la récolte" : "Enregistrer une récolte"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => { setIsAddYieldOpen(false); setEditingEvent(null); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleAddYield} className="space-y-3">
              {!editingEvent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted">Parcelles (répartition auto)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {farm.lots.map((l) => {
                      const isSel = selectedLotIds.has(l.id);
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
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-md border font-medium transition-colors",
                            isSel
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-muted hover:border-primary/40"
                          )}
                        >
                          {l.nom}
                        </button>
                      );
                    })}
                  </div>
                  {selectedLotIds.size === 0 && (
                    <p className="text-[10px] text-danger font-medium">Sélectionnez au moins un lot</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Date</label>
                  <Input type="date" value={yDate} onChange={(e) => setYDate(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Quantité totale (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={yQuantite}
                    onChange={(e) => setYQuantite(e.target.value)}
                    required
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Qté vendue (kg)</label>
                  <Input
                    type="number"
                    min="0"
                    value={yQuantiteVendue}
                    onChange={(e) => setYQuantiteVendue(e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Prix (DT/kg)</label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={yPrixVente}
                    onChange={(e) => setYPrixVente(e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsAddYieldOpen(false); setEditingEvent(null); }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    isSubmitting || (!editingEvent && selectedLotIds.size === 0)
                  }
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
