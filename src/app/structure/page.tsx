"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useFarmData } from "@/lib/useFarmData";
import { formatMoneyDT } from "@/lib/format";
import { CheckCircle2, Trees, Trash2, Sprout, Edit2, X, Check, Star, Settings, DollarSign, Map } from "lucide-react";

export default function StructurePage() {
  const farm = useFarmData();

  return (
    <AppShell title="Structure & Paramètres">
      <div className="mb-6 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Structure de la Ferme
        </h1>
        <p className="text-sm text-muted mt-1">Gérez la surface globale, le marché et ajoutez vos parcelles d'arbres.</p>
      </div>

      <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-6 max-w-2xl">
          <SettingsCard farm={farm} />
          <CreateBatchCard farm={farm} />
        </div>
      </div>
    </AppShell>
  );
}

function SettingsCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [saving, setSaving] = React.useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async (patch: any) => {
    setSaving("saving");
    await farm.actions.setSettings(patch);
    setSaving("saved");
    setTimeout(() => setSaving("idle"), 2000);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Surface et prix de vente estimés</CardDescription>
            </div>
          </div>
          {saving === "saved" && (
            <div className="flex items-center gap-1 text-xs text-primary animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 className="w-4 h-4" /> Enregistré
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label className="grid gap-1.5">
          <div className="text-sm font-medium text-foreground/80">Surface de la ferme (hectares)</div>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="pr-12 bg-background/50"
              defaultValue={String(farm.settings.surfaceHa ?? 0)}
              onBlur={(e) => handleSave({ surfaceHa: Number(e.target.value || 0) })}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
              ha
            </div>
          </div>
        </label>

        <label className="grid gap-1.5">
          <div className="text-sm font-medium text-foreground/80">Prix de vente estimé (par kg)</div>
          <div className="relative">
            <Input
              inputMode="decimal"
              className="pr-12 bg-background/50"
              defaultValue={String(farm.settings.prixKgOlives ?? 0)}
              onBlur={(e) => handleSave({ prixKgOlives: Number(e.target.value || 0) })}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
              DT
            </div>
          </div>
          <div className="text-xs text-muted mt-1 bg-muted/20 p-2 rounded-md inline-flex">
            💡 Exemple: 6.5 → {formatMoneyDT(6.5)} / kg
          </div>
        </label>

        <label className="grid gap-1.5 pt-2 border-t border-border/50">
          <div className="text-sm font-medium text-foreground/80">Pluviométrie annuelle (Estimation)</div>
          <div className="relative">
            <Input
              inputMode="numeric"
              className="pr-12 bg-background/50"
              defaultValue={String(farm.settings.pluviometrieAnnuelleMm ?? 300)}
              onBlur={(e) => handleSave({ pluviometrieAnnuelleMm: Number(e.target.value || 300) })}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
              mm/an
            </div>
          </div>
          <div className="text-xs text-muted mt-1">
            Utilisé pour évaluer la santé des lots non irrigués (Bour).
          </div>
        </label>
      </CardContent>
    </Card>
  );
}



function CreateBatchCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [nom, setNom] = React.useState("Lot 1");
  const [typeId, setTypeId] = React.useState<string>("");
  const [datePlantation, setDatePlantation] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [nb, setNb] = React.useState<string>("100");
  const [irrig, setIrrig] = React.useState<import("@/lib/domain").IrrigationStatus>("non_irrigue");
  const [croissance, setCroissance] = React.useState<number>(3);

  async function submit() {
    const chosen = typeId || farm.types[0]?.id;
    if (!chosen) return;
    await farm.actions.addBatch({
      nom: nom.trim() || "Lot",
      typeId: chosen,
      datePlantationISO: datePlantation,
      nbArbres: Math.max(1, Number(nb || 0)), // Prevent negative or zero
      irrigation: irrig,
      etatCroissance: croissance,
    });
    setNom("Nouveau lot");
    setNb("100");
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Création d'un Lot</CardTitle>
            <CardDescription>Ajoutez un groupe d'arbres (même variété, même âge)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <label className="grid gap-1.5">
          <div className="text-sm font-medium text-foreground/80">Nom du lot</div>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Lot Ouest" className="bg-background/50" />
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Date de plantation</div>
            <Input
              type="date"
              value={datePlantation}
              onChange={(e) => setDatePlantation(e.target.value)}
              className="bg-background/50"
            />
          </label>
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Nombre d'arbres</div>
            <Input inputMode="numeric" min="1" value={nb} onChange={(e) => setNb(e.target.value)} className="bg-background/50" />
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Variété</div>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              {farm.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Irrigation</div>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={irrig}
              onChange={(e) => setIrrig(e.target.value as any)}
            >
              <option value="non_irrigue">Bour (Non irrigué)</option>
              <option value="faible">Irrigué (Faible)</option>
              <option value="normal">Irrigué (Normal)</option>
              <option value="optimal">Irrigué (Optimal)</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1.5">
          <div className="text-sm font-medium text-foreground/80 flex items-center justify-between">
            <span>État de production</span>
            <span className="text-xs text-muted">
              {croissance === 1 && "Critique (0.4x)"}
              {croissance === 2 && "Faible (0.7x)"}
              {croissance === 3 && "Normal (1.0x)"}
              {croissance === 4 && "Bon (1.2x)"}
              {croissance === 5 && "Excellent (1.5x)"}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-background/50 p-2 rounded-md border border-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCroissance(star)}
                className={`p-1 rounded-md transition-colors ${
                  star <= croissance ? "text-warning hover:text-warning/80" : "text-muted hover:text-muted/80"
                }`}
              >
                <Star className={`w-6 h-6 ${star <= croissance ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>
        </label>
        
        <Button onClick={submit} disabled={farm.types.length === 0} className="w-full mt-2 gap-2">
          <Sprout className="w-4 h-4" />
          Ajouter le lot
        </Button>
      </CardContent>
    </Card>
  );
}


