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
  const [tab, setTab] = React.useState<"ponctuel" | "recurrent">("ponctuel");

  return (
    <AppShell
      title="Dépenses"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "ponctuel" ? "primary" : "secondary"} onClick={() => setTab("ponctuel")}>
            Ponctuelles
          </Button>
          <Button size="sm" variant={tab === "recurrent" ? "primary" : "secondary"} onClick={() => setTab("recurrent")}>
            Récurrentes
          </Button>
        </div>
      }
    >
      {tab === "ponctuel" ? <OneOffExpenses /> : <RecurringExpenses />}
    </AppShell>
  );
}

function OneOffExpenses() {
  const farm = useFarmData();
  const [dateISO, setDateISO] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [montant, setMontant] = React.useState<string>("0");
  const [categorie, setCategorie] = React.useState<ExpenseCategory>("entretien");
  const [lotId, setLotId] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");

  async function submit() {
    await farm.actions.addExpense({
      dateISO,
      montant: Number(montant || 0),
      categorie,
      lotId: lotId || undefined,
      note: note.trim() || undefined,
    });
    setMontant("0");
    setNote("");
  }

  return (
    <div className="grid gap-3">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ajouter une dépense</CardTitle>
            <CardDescription>Option: lier à un lot</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            <Input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
              <option value="">Aucun lot</option>
              {farm.lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom}
                </option>
              ))}
            </Select>
          </div>
          <Input placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button onClick={submit}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historique</CardTitle>
            <CardDescription>{farm.depenses.length} dépense(s)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {farm.depenses.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{formatMoneyDT(d.montant)}</div>
                <div className="text-xs text-muted">
                  {formatDateLong(d.dateISO)} · {EXPENSE_CATEGORY_LABEL[d.categorie as ExpenseCategory]}
                  {d.lotId ? ` · Lot` : ""}
                </div>
                {d.note ? <div className="mt-1 text-sm text-muted truncate">{d.note}</div> : null}
              </div>
              <Button variant="ghost" onClick={() => farm.actions.removeExpense(d.id)}>
                Supprimer
              </Button>
            </div>
          ))}
          {farm.depenses.length === 0 ? (
            <div className="text-sm text-muted">Aucune dépense enregistrée.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RecurringExpenses() {
  const farm = useFarmData();
  const [nom, setNom] = React.useState<string>("Irrigation");
  const [montantMensuel, setMontantMensuel] = React.useState<string>("0");
  const [categorie, setCategorie] = React.useState<ExpenseCategory>("irrigation");
  const [debutISO, setDebutISO] = React.useState<string>("2024-01-01");
  const [lotId, setLotId] = React.useState<string>("");

  async function submit() {
    await farm.actions.addRecurring({
      nom: nom.trim() || "Récurrent",
      montantMensuel: Number(montantMensuel || 0),
      categorie,
      debutISO,
      lotId: lotId || undefined,
    });
    setMontantMensuel("0");
  }

  return (
    <div className="grid gap-3">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ajouter un récurrent</CardTitle>
            <CardDescription>Génère une projection mensuelle</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={montantMensuel} onChange={(e) => setMontantMensuel(e.target.value)} />
            <Input type="date" value={debutISO} onChange={(e) => setDebutISO(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategory)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
              <option value="">Global</option>
              {farm.lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={submit}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Récurrents</CardTitle>
            <CardDescription>{farm.recurrents.length} ligne(s)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {farm.recurrents.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{r.nom}</div>
                <div className="text-xs text-muted">
                  {formatMoneyDT(r.montantMensuel)} / mois · {EXPENSE_CATEGORY_LABEL[r.categorie as ExpenseCategory]} · début {r.debutISO}
                </div>
              </div>
              <Button variant="ghost" onClick={() => farm.actions.removeRecurring(r.id)}>
                Supprimer
              </Button>
            </div>
          ))}
          {farm.recurrents.length === 0 ? (
            <div className="text-sm text-muted">Aucun récurrent.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

