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
import { Wallet, RefreshCw, Plus, Trash2, CalendarDays, Edit2, X, Check, Printer } from "lucide-react";
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

export default function DepensesPage() {
  const farm = useFarmData();

  const totalPonctuel = farm.depenses.reduce((acc, d) => acc + d.montant, 0);

  return (
    <AppShell 
      title="Dépenses"
      actions={
        <Button size="sm" variant="secondary" className="gap-2 print:hidden" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Exporter PDF</span>
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider">Total Investi</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {formatMoneyDT(totalPonctuel)}
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Dépenses Ponctuelles
          </h2>
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
  const [lotId, setLotId] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");

  async function submit() {
    if (!montant || Number(montant) <= 0) return;
    await farm.actions.addExpense({
      dateISO,
      montant: Number(montant),
      categorie,
      lotId: lotId || undefined,
      note: note.trim() || undefined,
    });
    setMontant("");
    setNote("");
  }

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-4 print:block">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm h-fit print:hidden">
        <CardHeader>
          <div>
            <CardTitle>Nouvelle dépense</CardTitle>
            <CardDescription>Achats de matériel, main d'œuvre ponctuelle...</CardDescription>
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
            <div className="text-sm font-medium text-foreground/80">Lier à un lot (Optionnel)</div>
            <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
              <option value="">-- Aucun lot (Global) --</option>
              {farm.lots.map((l) => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Note (Optionnel)</div>
            <Input placeholder="Description..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-background/50" />
          </label>
          <Button onClick={submit} disabled={!montant || Number(montant) <= 0} className="w-full gap-2 mt-2">
            <Plus className="w-4 h-4" /> Enregistrer la dépense
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div>
            <CardTitle>Historique</CardTitle>
            <CardDescription>{farm.depenses.length} dépense(s)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {farm.depenses.map((d) => (
            <ExpenseRow key={d.id} d={d} farm={farm} />
          ))}
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

  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-background/40 p-3 hover:border-border transition-colors">
      <div className="flex gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-muted" />
        </div>
        <div>
          <div className="text-sm font-bold">{formatMoneyDT(d.montant)}</div>
          <div className="text-xs text-muted mt-0.5">
            {formatDateLong(d.dateISO)} · <span className="font-medium text-foreground/80">{EXPENSE_CATEGORY_LABEL[d.categorie as ExpenseCategory]}</span>
            {d.lotId && farm.lots.find(l => l.id === d.lotId) ? ` · ${farm.lots.find(l => l.id === d.lotId)?.nom}` : ""}
          </div>
          {d.note ? <div className="mt-1 text-xs text-muted/80 italic line-clamp-1">{d.note}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => farm.actions.removeExpense(d.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
