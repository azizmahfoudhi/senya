"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ageYearsFromISO, batchEstimatedProductionKg, sumExpensesForBatch } from "@/lib/engine";
import { todayISO } from "@/lib/derive";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";

export default function LotDetailPage() {
  const farm = useFarmData();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const lot = farm.lots.find((l) => l.id === id);
  const typeById = useMemo(() => new Map(farm.types.map((t) => [t.id, t])), [farm.types]);
  const tISO = todayISO();

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
  const age = ageYearsFromISO(lot.datePlantationISO, tISO);
  const farmState = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    scenarios: farm.scenarios,
  };
  const cost = sumExpensesForBatch(farmState, lot.id);
  const prod = type ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO }) : 0;
  const perTreeCost = lot.nbArbres > 0 ? cost / lot.nbArbres : 0;
  const yieldPerTree = lot.nbArbres > 0 ? prod / lot.nbArbres : 0;

  return (
    <AppShell title={lot.nom}>
      <div className="grid gap-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Résumé du lot</CardTitle>
              <CardDescription>
                {type?.nom ?? "Type inconnu"} · {formatNumber(lot.nbArbres)} arbres ·{" "}
                {formatNumber(age, 1)} ans · {lot.irrigation === "irrigue" ? "Irrigué" : "Non irrigué"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Kpi label="Coûts (ponctuels)" value={formatMoneyDT(cost)} />
            <Kpi label="Coût / arbre" value={formatMoneyDT(perTreeCost)} />
            <Kpi label="Rendement estimé / arbre" value={`${formatNumber(yieldPerTree, 1)} kg`} />
            <Kpi label="Production estimée" value={formatKg(prod)} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

