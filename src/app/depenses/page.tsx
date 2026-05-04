"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ExpenseCategory } from "@/lib/domain";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/domain";
import { formatDateLong, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { Wallet, RefreshCw, Plus, Trash2, CalendarDays, Edit2, X, Check, Printer, Sprout, Users, Truck, Droplets, Hammer, Wrench, MoreHorizontal, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

const categories: ExpenseCategory[] = [
  "plantation",
  "main_oeuvre",
  "transport",
  "irrigation",
  "equipement",
  "entretien",
  "autre",
];

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  plantation: Sprout,
  main_oeuvre: Users,
  transport: Truck,
  irrigation: Droplets,
  equipement: Hammer,
  entretien: Wrench,
  autre: MoreHorizontal,
};

export default function DepensesPage() {
  const farm = useFarmData();

  const totalPonctuel = farm.depenses.reduce((acc, d) => acc + d.montant, 0);

  return (
    <AppShell 
      title="Gestion Financière"
      actions={
        <Button size="sm" variant="outline" className="gap-2 print:hidden rounded-xl border-border/50 bg-background/40 hover:bg-primary/5" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline font-bold uppercase tracking-widest text-[10px]">Exporter PDF</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-10">
        {/* HEADER & SUMMARY */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <div className="flex-1 space-y-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 rounded-[2.5rem] border border-primary/20 shadow-inner relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Flux Financier
            </h1>
            <p className="text-muted-foreground font-medium text-lg pt-1">Suivi détaillé de vos investissements et charges opérationnelles.</p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="inline-flex items-center gap-3 bg-background/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/50 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Investi</div>
                  <div className="text-2xl font-black tracking-tighter">{formatMoneyDT(totalPonctuel)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-72 glass-card rounded-[2.5rem] p-6 flex flex-col justify-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 text-center">Répartition Rapide</div>
            <div className="space-y-3">
              {categories.map(cat => {
                const amount = farm.depenses.filter(d => d.categorie === cat).reduce((sum, d) => sum + d.montant, 0);
                if (amount <= 0) return null;
                
                const pct = totalPonctuel > 0 ? (amount / totalPonctuel) * 100 : 0;
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <div key={cat} className="space-y-1 animate-in fade-in slide-in-from-right-2 duration-500">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="flex items-center gap-1.5"><Icon className="w-3 h-3 text-primary" /> {EXPENSE_CATEGORY_LABEL[cat]}</span>
                      <span className="text-muted">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Saisie des Opérations</h2>
          </div>
          <OneOffExpenses />
        </div>
      </div>
    </AppShell>
  );
}

function OneOffExpenses() {
  const farm = useFarmData();
  const [dateISO, setDateISO] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = React.useState<string>("");
  const [categorie, setCategorie] = React.useState<ExpenseCategory>("entretien");
  const [selectedLotIds, setSelectedLotIds] = React.useState<Set<string>>(new Set());
  const [note, setNote] = React.useState<string>("");

  async function submit() {
    if (!montant || Number(montant) <= 0) return;
    
    const totalMontant = Number(montant);

    if (selectedLotIds.size === 0) {
      // Dépense globale
      await farm.actions.addExpense({
        dateISO,
        montant: totalMontant,
        categorie,
        lotId: undefined,
        note: note.trim() || undefined,
      });
    } else {
      // Répartition proportionnelle selon le nombre d'arbres
      const selectedLots = farm.lots.filter(l => selectedLotIds.has(l.id));
      const totalTrees = selectedLots.reduce((sum, l) => sum + l.nbArbres, 0);
      
      for (const lot of selectedLots) {
        const proportion = totalTrees > 0 ? (lot.nbArbres / totalTrees) : (1 / selectedLots.length);
        const lotMontant = Number((totalMontant * proportion).toFixed(3));
        
        await farm.actions.addExpense({
          dateISO,
          montant: lotMontant,
          categorie,
          lotId: lot.id,
          note: note.trim() || undefined,
        });
      }
    }

    setMontant("");
    setNote("");
    setSelectedLotIds(new Set());
  }

  return (
    <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 print:block">
      <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-xl h-fit print:hidden relative overflow-hidden group">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 animate-scanning z-20 pointer-events-none" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight">Nouvelle Dépense</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Matériel, main d'œuvre, etc.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Montant</div>
            <div className="relative">
              <Input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0.00" className="pr-10 bg-background/50" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">DT</div>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Date</div>
              <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="bg-background/50" />
            </label>
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Catégorie</div>
              <Select value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
                ))}
              </Select>
            </label>
          </div>
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Affecter à des parcelles (Optionnel)</div>
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
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105' : 'bg-background hover:bg-muted border-border/60 text-muted-foreground'}`}
                      title={isSelected ? "Retirer ce lot de la répartition" : "Inclure ce lot dans la répartition"}
                    >
                      {l.nom}
                    </button>
                  );
                })}
              </div>
              {selectedLotIds.size === 0 ? (
                <div className="text-[10px] text-muted-foreground italic bg-muted/5 p-2 rounded-lg border border-dashed border-border/40">
                  💡 Sans sélection, la dépense est considérée comme <strong>globale</strong> (répartie sur toute la surface).
                </div>
              ) : (
                <div className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/5 p-2 rounded-lg border border-primary/20 animate-in fade-in zoom-in-95">
                  ✨ Répartition automatique basée sur le nombre d'arbres ({selectedLotIds.size} lots)
                </div>
              )}
            </label>
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Note (Optionnel)</div>
            <Input placeholder="Description..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-background/50" />
          </label>
          <Button onClick={submit} disabled={!montant || Number(montant) <= 0} className="w-full gap-2 mt-4 rounded-2xl h-12 shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4" /> Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-[2.5rem] border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black tracking-tight">Historique des Opérations</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">{farm.depenses.length} mouvement(s) enregistré(s)</CardDescription>
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center text-muted border border-border/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {farm.depenses.map((d) => (
              <ExpenseRow key={d.id} d={d} farm={farm} />
            ))}
          </div>
          {farm.depenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-muted/5">
              <Wallet className="w-8 h-8 text-muted mb-3" />
              <div className="text-sm font-medium">Aucune dépense ponctuelle</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseRow({ d, farm }: { d: any; farm: ReturnType<typeof useFarmData> }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [montant, setMontant] = React.useState(String(d.montant));
  const [dateISO, setDateISO] = React.useState(d.dateISO);
  const [categorie, setCategorie] = React.useState(d.categorie);
  const [lotId, setLotId] = React.useState(d.lotId || "");
  const [note, setNote] = React.useState(d.note || "");

  async function handleSave() {
    if (!montant || Number(montant) <= 0) return;
    await farm.actions.updateExpense(d.id, {
      montant: Number(montant),
      dateISO,
      categorie,
      lotId: lotId || undefined,
      note: note.trim() || undefined,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-primary/50 bg-primary/5 p-3 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Modifier dépense</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" onClick={handleSave}><Check className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} className="h-8 bg-background" placeholder="Montant" />
          <Input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className="h-8 bg-background" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={categorie} onChange={e => setCategorie(e.target.value as ExpenseCategory)}>
            {categories.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>)}
          </Select>
          <Select value={lotId} onChange={e => setLotId(e.target.value)}>
            <option value="">-- Global --</option>
            {farm.lots.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </Select>
        </div>
        <Input value={note} onChange={e => setNote(e.target.value)} className="h-8 bg-background" placeholder="Note" />
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[d.categorie as ExpenseCategory] || Wallet;

  return (
    <div className="group flex items-start justify-between gap-3 p-5 hover:bg-primary/[0.02] transition-all relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
      <div className="flex gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center shrink-0 border border-border/30 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
          <Icon className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
        </div>
        <div>
          <div className="text-lg font-black tracking-tight">{formatMoneyDT(d.montant)}</div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-2 mt-0.5">
            <span className="text-foreground/70">{EXPENSE_CATEGORY_LABEL[d.categorie as ExpenseCategory]}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{formatDateLong(d.dateISO)}</span>
            {d.lotId && farm.lots.find(l => l.id === d.lotId) && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-primary/70">{farm.lots.find(l => l.id === d.lotId)?.nom}</span>
              </>
            )}
          </div>
          {d.note ? <div className="mt-2 text-xs text-muted/60 italic font-medium bg-muted/5 px-2 py-1 rounded-lg inline-block">{d.note}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(true)} title="Modifier la dépense">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-danger" 
          onClick={() => {
            if (confirm(`Voulez-vous vraiment supprimer cette dépense de ${formatMoneyDT(d.montant)} ?`)) {
              farm.actions.removeExpense(d.id);
            }
          }}
          title="Supprimer la dépense"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
