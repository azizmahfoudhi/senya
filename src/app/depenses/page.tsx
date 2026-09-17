"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { ExpenseCategory } from "@/lib/domain";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/domain";
import { formatDateLong, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Printer,
  Sprout,
  Users,
  Truck,
  Droplets,
  Hammer,
  Wrench,
  MoreHorizontal,
  CalendarDays,
} from "lucide-react";
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

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
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

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalAll = farm.depenses.reduce((acc, d) => acc + d.montant, 0);
  const totalThisMonth = farm.depenses
    .filter((d) => d.dateISO.startsWith(thisMonthPrefix))
    .reduce((acc, d) => acc + d.montant, 0);

  return (
    <AppShell
      title="Gestion Financière"
      actions={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exporter PDF</span>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Total dépenses"
            value={formatMoneyDT(totalAll)}
            icon={<Wallet className="w-4 h-4" />}
          />
          <Stat
            label="Ce mois"
            value={formatMoneyDT(totalThisMonth)}
            icon={<CalendarDays className="w-4 h-4" />}
          />
          <Stat
            label="Opérations"
            value={farm.depenses.length}
            sub="total enregistrées"
          />
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
          <AddExpensePanel farm={farm} categories={categories} totalAll={totalAll} />
          <ExpenseListPanel farm={farm} categories={categories} totalAll={totalAll} />
        </div>
      </div>
    </AppShell>
  );
}

function AddExpensePanel({
  farm,
  categories,
  totalAll,
}: {
  farm: ReturnType<typeof useFarmData>;
  categories: ExpenseCategory[];
  totalAll: number;
}) {
  const [dateISO, setDateISO] = React.useState(new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = React.useState("");
  const [categorie, setCategorie] = React.useState<ExpenseCategory>("entretien");
  const [selectedLotIds, setSelectedLotIds] = React.useState<Set<string>>(new Set());
  const [note, setNote] = React.useState("");

  async function submit() {
    if (!montant || Number(montant) <= 0) return;
    const totalMontant = Number(montant);

    if (selectedLotIds.size === 0) {
      await farm.actions.addExpense({
        dateISO,
        montant: totalMontant,
        categorie,
        lotId: undefined,
        note: note.trim() || undefined,
      });
    } else {
      const selectedLots = farm.lots.filter((l) => selectedLotIds.has(l.id));
      let totalWeight = 0;
      const lotsWithWeights = selectedLots.map((l) => {
        const age = Math.max(0, new Date().getFullYear() - new Date(l.datePlantationISO).getFullYear());
        let weightFactor = 1.0;
        if (categorie === "irrigation") {
          if (age < 4) weightFactor = 0.3;
          else if (age < 8) weightFactor = 0.6;
        }
        const weight = l.nbArbres * weightFactor;
        totalWeight += weight;
        return { lot: l, weight };
      });
      for (const item of lotsWithWeights) {
        const proportion = totalWeight > 0 ? item.weight / totalWeight : 1 / selectedLots.length;
        await farm.actions.addExpense({
          dateISO,
          montant: Number((totalMontant * proportion).toFixed(3)),
          categorie,
          lotId: item.lot.id,
          note: note.trim() || undefined,
        });
      }
    }
    setMontant("");
    setNote("");
    setSelectedLotIds(new Set());
  }

  return (
    <Card className="h-fit print:hidden">
      <CardHeader>
        <CardTitle>Nouvelle Dépense</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Amount */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Montant (DT)</label>
          <div className="relative">
            <Input
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0.00"
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">DT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Date</label>
            <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Catégorie</label>
            <Select value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}>
              {categories.map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Lot assignment */}
        {farm.lots.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Affecter à des parcelles (optionnel)</label>
            <div className="flex flex-wrap gap-1.5">
              {farm.lots.map((l) => {
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
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-md border transition-colors font-medium",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {l.nom}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted">
              {selectedLotIds.size === 0
                ? "Sans sélection → dépense globale (répartie automatiquement)"
                : `Répartition sur ${selectedLotIds.size} lot(s) selon le nombre d'arbres`}
            </p>
          </div>
        )}

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Note (optionnel)</label>
          <Input
            placeholder="Description..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button
          onClick={submit}
          disabled={!montant || Number(montant) <= 0}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Enregistrer
        </Button>

        {/* Category breakdown */}
        {totalAll > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted">
              Répartition
            </p>
            {categories.map((cat) => {
              const amount = farm.depenses
                .filter((d) => d.categorie === cat)
                .reduce((sum, d) => sum + d.montant, 0);
              if (amount <= 0) return null;
              const pct = (amount / totalAll) * 100;
              const Icon = CATEGORY_ICONS[cat];
              return (
                <div key={cat} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted">
                      <Icon className="w-3 h-3" />
                      {EXPENSE_CATEGORY_LABEL[cat]}
                    </span>
                    <span className="font-medium">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseListPanel({
  farm,
  categories,
  totalAll,
}: {
  farm: ReturnType<typeof useFarmData>;
  categories: ExpenseCategory[];
  totalAll: number;
}) {
  const [filterCategories, setFilterCategories] = React.useState<Set<ExpenseCategory>>(new Set());

  const filteredExpenses = farm.depenses.filter(
    (d) => filterCategories.size === 0 || filterCategories.has(d.categorie as ExpenseCategory)
  );
  const filteredTotal = filteredExpenses.reduce((sum, d) => sum + d.montant, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Historique des Opérations</CardTitle>
          <span className="text-xs text-muted">{filteredExpenses.length} opération(s)</span>
        </div>
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = filterCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => {
                  const next = new Set(filterCategories);
                  if (next.has(cat)) next.delete(cat);
                  else next.add(cat);
                  setFilterCategories(next);
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted hover:border-primary/40"
                )}
              >
                <Icon className="w-3 h-3" />
                {EXPENSE_CATEGORY_LABEL[cat]}
              </button>
            );
          })}
          {filterCategories.size > 0 && (
            <button
              onClick={() => setFilterCategories(new Set())}
              className="px-2 py-1 rounded-md text-xs text-danger hover:bg-danger/10 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {farm.depenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Wallet className="w-8 h-8 text-muted" />
            <p className="text-sm text-muted">Aucune dépense enregistrée</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="hidden sm:table-cell">Lot</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
                <TableHead className="w-16 print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((d) => (
                <ExpenseRow key={d.id} d={d} farm={farm} />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold text-xs uppercase tracking-wide text-muted">
                  Total affiché
                </TableCell>
                <TableCell className="text-right font-bold">{formatMoneyDT(filteredTotal)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseRow({
  d,
  farm,
}: {
  d: ReturnType<typeof useFarmData>["depenses"][number];
  farm: ReturnType<typeof useFarmData>;
}) {
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

  const Icon = CATEGORY_ICONS[d.categorie as ExpenseCategory] || Wallet;
  const lotName = d.lotId ? farm.lots.find((l) => l.id === d.lotId)?.nom : null;

  if (isEditing) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <div className="flex flex-col gap-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Modifier</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="text-success h-7 w-7" onClick={handleSave}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted h-7 w-7" onClick={() => setIsEditing(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant" />
              <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              <Select value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}>
                {categories.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>)}
              </Select>
              <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
                <option value="">-- Global --</option>
                {farm.lots.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </Select>
            </div>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="group">
      <TableCell className="text-muted">
        {new Date(d.dateISO).toLocaleDateString("fr-FR")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
          <span>{EXPENSE_CATEGORY_LABEL[d.categorie as ExpenseCategory]}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold">{formatMoneyDT(d.montant)}</TableCell>
      <TableCell className="hidden sm:table-cell text-muted text-xs">
        {lotName ?? <span className="italic">Global</span>}
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted text-xs max-w-32 truncate">
        {d.note}
      </TableCell>
      <TableCell className="print:hidden">
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-danger"
            onClick={() => {
              if (confirm(`Supprimer cette dépense de ${formatMoneyDT(d.montant)} ?`))
                farm.actions.removeExpense(d.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
