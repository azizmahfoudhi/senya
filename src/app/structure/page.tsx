"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useFarmData } from "@/lib/useFarmData";
import { formatMoneyDT } from "@/lib/format";

export default function StructurePage() {
  const farm = useFarmData();

  return (
    <AppShell title="Structure">
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Surface et prix de vente</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="grid gap-1">
              <div className="text-xs text-muted">Surface (hectares)</div>
              <Input
                inputMode="decimal"
                defaultValue={String(farm.settings.surfaceHa ?? 0)}
                onBlur={(e) => farm.actions.setSettings({ surfaceHa: Number(e.target.value || 0) })}
              />
            </label>

            <label className="grid gap-1">
              <div className="text-xs text-muted">Prix de vente (par kg)</div>
              <Input
                inputMode="decimal"
                defaultValue={String(farm.settings.prixKgOlives ?? 0)}
                onBlur={(e) =>
                  farm.actions.setSettings({ prixKgOlives: Number(e.target.value || 0) })
                }
              />
              <div className="text-xs text-muted">
                Exemple: 6.5 → {formatMoneyDT(6.5)} / kg
              </div>
            </label>
          </CardContent>
        </Card>

        <TreeTypesCard />
        <CreateBatchCard />
      </div>
    </AppShell>
  );
}

function TreeTypesCard() {
  const farm = useFarmData();
  const [nom, setNom] = React.useState("");
  const [rend, setRend] = React.useState("20");

  async function submit() {
    if (!nom.trim()) return;
    await farm.actions.addTreeType(nom.trim(), Number(rend || 0));
    setNom("");
    setRend("20");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Types d’olivier</CardTitle>
          <CardDescription>Rendement max à maturité (kg/arbre)</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Koroneiki…" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Input
            inputMode="decimal"
            placeholder="Rendement max"
            value={rend}
            onChange={(e) => setRend(e.target.value)}
          />
        </div>
        <Button onClick={submit}>Ajouter le type</Button>

        <div className="grid gap-2">
          {farm.types.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{t.nom}</div>
                <div className="text-xs text-muted">{t.rendementMaxKgParArbre} kg/arbre</div>
              </div>
              <Button variant="ghost" onClick={() => farm.actions.removeTreeType(t.id)}>
                Supprimer
              </Button>
            </div>
          ))}
          {farm.types.length === 0 ? (
            <div className="text-sm text-muted">Ajoutez au moins un type pour créer des lots.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBatchCard() {
  const farm = useFarmData();
  const [nom, setNom] = React.useState("Nouveau lot");
  const [typeId, setTypeId] = React.useState<string>("");
  const [datePlantation, setDatePlantation] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [nb, setNb] = React.useState<string>("100");
  const [irrig, setIrrig] = React.useState<"irrigue" | "non_irrigue">("non_irrigue");

  async function submit() {
    const chosen = typeId || farm.types[0]?.id;
    if (!chosen) return;
    await farm.actions.addBatch({
      nom: nom.trim() || "Lot",
      typeId: chosen,
      datePlantationISO: datePlantation,
      nbArbres: Number(nb || 0),
      irrigation: irrig,
    });
    setNom("Nouveau lot");
    setNb("100");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Créer un lot</CardTitle>
          <CardDescription>Arbres plantés au même moment</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du lot" />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={datePlantation}
            onChange={(e) => setDatePlantation(e.target.value)}
          />
          <Input inputMode="numeric" value={nb} onChange={(e) => setNb(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">Type…</option>
            {farm.types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
          <select
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            value={irrig}
            onChange={(e) => setIrrig(e.target.value as any)}
          >
            <option value="non_irrigue">Non irrigué</option>
            <option value="irrigue">Irrigué</option>
          </select>
        </div>
        <Button onClick={submit} disabled={farm.types.length === 0}>
          Ajouter le lot
        </Button>
      </CardContent>
    </Card>
  );
}

