"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useFarmData } from "@/lib/useFarmData";
import { computeLotHealth, computeLotForecast } from "@/lib/intelligence";
import {
  CheckCircle2,
  Trees,
  Plus,
  Edit2,
  X,
  Check,
  Star,
  Settings,
  Map,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function StructurePage() {
  const farm = useFarmData();
  const [isAddingLot, setIsAddingLot] = React.useState(false);
  const [editingTypeId, setEditingTypeId] = React.useState<string | null>(null);
  const [editMaxYield, setEditMaxYield] = React.useState("");

  async function calibrateIA() {
    if (
      !confirm(
        "Mettre à jour les modèles botaniques selon les standards scientifiques (Chemlali 60kg, Koroneiki 45kg) ?"
      )
    )
      return;
    for (const t of farm.types) {
      if (t.nom.toLowerCase().includes("chemlali"))
        await farm.actions.updateTreeType(t.id, { rendementMaxKgParArbre: 60 });
      if (t.nom.toLowerCase().includes("koroneiki"))
        await farm.actions.updateTreeType(t.id, { rendementMaxKgParArbre: 45 });
    }
    alert("Modèles calibrés !");
  }

  const varietiesAnalysis = farm.types.map((type) => {
    const typeLots = farm.lots.filter((l) => l.typeId === type.id);
    const totalTrees = typeLots.reduce((sum, l) => sum + l.nbArbres, 0);
    let avgHealth = 0;
    let totalActualYield = 0;
    if (typeLots.length > 0) {
      typeLots.forEach((l) => {
        const h = computeLotHealth(farm, l.id);
        const f = computeLotForecast(farm, l.id);
        avgHealth += h.total * l.nbArbres;
        totalActualYield += f.yieldKg;
      });
      avgHealth /= totalTrees;
    }
    return {
      ...type,
      totalTrees,
      avgHealth,
      actualYieldPerTree: totalTrees > 0 ? totalActualYield / totalTrees : 0,
    };
  });

  if (farm.loading)
    return (
      <AppShell title="Configuration">
        <p className="text-sm text-muted animate-pulse">Chargement...</p>
      </AppShell>
    );

  return (
    <AppShell title="Configuration">
      <div className="space-y-6">
        {/* Varietal performance pivot */}
        {farm.types.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Pivot de Rendement Variétal</CardTitle>
                  <CardDescription>
                    Performance des variétés selon les piliers de santé.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={calibrateIA}
                  className="gap-1.5"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Calibrer standards
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modèle</TableHead>
                    <TableHead className="text-right">Arbres</TableHead>
                    <TableHead>Plafond max</TableHead>
                    <TableHead>Indice santé</TableHead>
                    <TableHead>Potentiel réel</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {varietiesAnalysis.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="font-semibold">{v.nom}</div>
                        <div className="text-[10px] text-muted uppercase tracking-wide">
                          {v.isIntensive ? "Intensif" : "Traditionnel"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{v.totalTrees}</TableCell>
                      <TableCell className="text-muted">
                        {v.rendementMaxKgParArbre} kg/arbre
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-36">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                v.avgHealth > 70
                                  ? "bg-success"
                                  : v.avgHealth > 40
                                  ? "bg-warning"
                                  : "bg-danger"
                              )}
                              style={{ width: `${v.avgHealth}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums w-8 text-right">
                            {Math.round(v.avgHealth)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {v.totalTrees > 0
                            ? `${(Math.round(v.actualYieldPerTree * 10) / 10).toFixed(1)} kg/arbre`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {v.totalTrees === 0 ? (
                          <Badge variant="muted">Inactif</Badge>
                        ) : v.avgHealth > 75 ? (
                          <Badge variant="success">Optimisé</Badge>
                        ) : v.avgHealth > 50 ? (
                          <Badge variant="warning">À surveiller</Badge>
                        ) : (
                          <Badge variant="danger">Critique</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <SettingsCard farm={farm} />

            {/* Botanical models */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Modèles Botaniques</CardTitle>
                    <CardDescription>Profils de production théoriques par variété.</CardDescription>
                  </div>
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Trees className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {farm.types.length === 0 ? (
                  <p className="text-sm text-muted py-4 text-center">
                    Aucune variété configurée.
                  </p>
                ) : (
                  farm.types.map((type) => {
                    const analysis = varietiesAnalysis.find((v) => v.id === type.id);
                    return (
                      <div
                        key={type.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{type.nom}</div>
                          <div className="text-[10px] text-muted uppercase tracking-wide">
                            {type.isIntensive ? "Intensif" : "Traditionnel"}
                          </div>
                        </div>

                        {/* Inline editable max yield */}
                        <div className="flex items-center gap-1">
                          {editingTypeId === type.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                className="h-7 w-16 text-xs px-2"
                                value={editMaxYield}
                                onChange={(e) => setEditMaxYield(e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  farm.actions.updateTreeType(type.id, {
                                    rendementMaxKgParArbre: Number(editMaxYield),
                                  });
                                  setEditingTypeId(null);
                                }}
                                className="p-1 rounded text-success hover:bg-success/10 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingTypeId(null)}
                                className="p-1 rounded text-muted hover:bg-secondary transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingTypeId(type.id);
                                setEditMaxYield(String(type.rendementMaxKgParArbre));
                              }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Max {type.rendementMaxKgParArbre} kg/arbre
                              <Edit2 className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-primary">
                            {Math.round(analysis?.avgHealth || 0)}%
                          </div>
                          <div className="text-[10px] text-muted">Santé moy.</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Create lot form */}
          <div className="lg:sticky lg:top-8 h-fit">
            <CreateBatchCard
              farm={farm}
              isOpen={isAddingLot}
              onToggle={() => setIsAddingLot(!isAddingLot)}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [saving, setSaving] = React.useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async (patch: Parameters<typeof farm.actions.setSettings>[0]) => {
    setSaving("saving");
    await farm.actions.setSettings(patch);
    setSaving("saved");
    setTimeout(() => setSaving("idle"), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle>Configuration Globale</CardTitle>
              <CardDescription>Dimensions et économie de l'exploitation</CardDescription>
            </div>
          </div>
          {saving === "saved" && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Enregistré
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <Map className="w-3 h-3" /> Surface totale
          </label>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="pr-10"
              defaultValue={String(farm.settings.surfaceHa ?? 0)}
              onBlur={(e) => handleSave({ surfaceHa: Number(e.target.value || 0) })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-medium">
              ha
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Prix de vente moyen</label>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="pr-12"
              defaultValue={String(farm.settings.prixKgOlives ?? 0)}
              onBlur={(e) => handleSave({ prixKgOlives: Number(e.target.value || 0) })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-medium">
              DT/kg
            </span>
          </div>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted">Pluviométrie annuelle manuelle</label>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="pr-10"
              defaultValue={String(farm.settings.pluviometrieAnnuelleMm ?? 300)}
              onBlur={(e) =>
                handleSave({ pluviometrieAnnuelleMm: Number(e.target.value || 300) })
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-medium">
              mm
            </span>
          </div>
          <p className="text-[10px] text-muted">
            Remplacé automatiquement par la projection Open-Meteo quand disponible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBatchCard({
  farm,
  isOpen,
  onToggle,
}: {
  farm: ReturnType<typeof useFarmData>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [nom, setNom] = React.useState("Lot A");
  const [typeId, setTypeId] = React.useState("");
  const [datePlantation, setDatePlantation] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [nb, setNb] = React.useState("100");
  const [irrig, setIrrig] = React.useState<"non_irrigue" | "faible" | "normal" | "optimal">(
    "non_irrigue"
  );
  const [croissance, setCroissance] = React.useState(3);

  async function submit() {
    const chosen = typeId || farm.types[0]?.id;
    if (!chosen) return;
    await farm.actions.addBatch({
      nom: nom.trim() || "Lot",
      typeId: chosen,
      datePlantationISO: datePlantation,
      nbArbres: Math.max(1, Number(nb || 0)),
      irrigation: irrig,
      etatCroissance: croissance,
      stressLevel: "bas",
    });
    setNom("Nouveau lot");
    setNb("100");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-success/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-success" />
            </div>
            <div>
              <CardTitle>Nouveau Lot</CardTitle>
              <CardDescription>Extension du patrimoine</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {farm.types.length === 0 && (
          <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            ⚠️ Ajoutez au moins une variété d'arbre avant de créer un lot.
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Identifiant / Nom</label>
          <Input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Lot Nord A"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Date plantation</label>
            <Input
              type="date"
              value={datePlantation}
              onChange={(e) => setDatePlantation(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Nombre d'arbres</label>
            <Input
              inputMode="numeric"
              min="1"
              value={nb}
              onChange={(e) => setNb(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Variété</label>
            <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Sélectionner...</option>
              {farm.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Irrigation</label>
            <Select value={irrig} onChange={(e) => setIrrig(e.target.value as typeof irrig)}>
              <option value="non_irrigue">Bour (Sec)</option>
              <option value="faible">Irrigué (Faible)</option>
              <option value="normal">Irrigué (Normal)</option>
              <option value="optimal">Irrigué (Optimal)</option>
            </Select>
          </div>
        </div>

        {/* Vigor stars */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-muted">Vigueur végétative</label>
            <span className="text-primary font-semibold">{croissance * 20}%</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCroissance(star)}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  star <= croissance ? "text-warning" : "text-muted/30 hover:text-muted"
                )}
              >
                <Star
                  className={cn("w-5 h-5", star <= croissance && "fill-current")}
                />
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={submit}
          disabled={farm.types.length === 0}
          className="w-full gap-2 mt-2"
        >
          <Plus className="w-4 h-4" />
          Créer le lot
        </Button>
      </CardContent>
    </Card>
  );
}
