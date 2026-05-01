"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ageYearsFromISO, batchEstimatedProductionKg, sumExpensesForBatch } from "@/lib/engine";
import { formatKg, formatMoneyDT, formatNumber } from "@/lib/format";
import { todayISO } from "@/lib/derive";
import { useFarmData } from "@/lib/useFarmData";

export default function LotsPage() {
  const farm = useFarmData();
  const typeById = new Map(farm.types.map((t) => [t.id, t]));
  const tISO = todayISO();

  return (
    <AppShell title="Lots">
      <div className="grid gap-3">
        {farm.lots.map((lot) => {
          const type = typeById.get(lot.typeId);
          const age = ageYearsFromISO(lot.datePlantationISO, tISO);
          const prod = type ? batchEstimatedProductionKg({ batch: lot, type, atISO: tISO }) : 0;
          const cost = sumExpensesForBatch(
            {
              settings: farm.settings,
              types: farm.types,
              lots: farm.lots,
              depenses: farm.depenses,
              recurrents: farm.recurrents,
              scenarios: farm.scenarios,
            },
            lot.id,
          );
          return (
            <Card key={lot.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="truncate">{lot.nom}</CardTitle>
                  <CardDescription>
                    {type?.nom ?? "Type inconnu"} · {formatNumber(lot.nbArbres)} arbres ·{" "}
                    {formatNumber(age, 1)} ans · {lot.irrigation === "irrigue" ? "Irrigué" : "Non irrigué"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border p-3">
                    <div className="text-xs text-muted">Production estimée</div>
                    <div className="mt-1 text-base font-semibold">{formatKg(prod)}</div>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <div className="text-xs text-muted">Coûts (ponctuels)</div>
                    <div className="mt-1 text-base font-semibold">{formatMoneyDT(cost)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link className="text-sm font-medium text-primary" href={`/lots/${lot.id}`}>
                    Voir le détail →
                  </Link>
                  <Button variant="ghost" onClick={() => farm.actions.removeBatch(lot.id)}>
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {farm.lots.length === 0 ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Aucun lot</CardTitle>
                <CardDescription>Créez un lot pour obtenir des estimations.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary" href="/structure">
                Aller à Structure →
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

