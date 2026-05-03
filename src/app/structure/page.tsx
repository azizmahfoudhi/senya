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

  const [activeTab, setActiveTab] = React.useState<"params" | "varietes" | "lots">("params");

  return (
    <AppShell title="Structure & Paramètres">
      <div className="mb-6 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Structure de la Ferme
        </h1>
        <p className="text-sm text-muted mt-1">Gérez la surface globale, le marché et ajoutez vos parcelles d'arbres.</p>
      </div>

      <div className="flex flex-wrap gap-2 pb-2 mb-6 animate-in fade-in slide-in-from-bottom-2">
        <Button 
          variant={activeTab === "params" ? "primary" : "secondary"} 
          onClick={() => setActiveTab("params")}
          className="rounded-full"
        >
          <Settings className="w-4 h-4 mr-2" /> Paramètres Généraux
        </Button>
        <Button 
          variant={activeTab === "varietes" ? "primary" : "secondary"} 
          onClick={() => setActiveTab("varietes")}
          className="rounded-full"
        >
          <Trees className="w-4 h-4 mr-2" /> Variétés d'olives
        </Button>
        <Button 
          variant={activeTab === "lots" ? "primary" : "secondary"} 
          onClick={() => setActiveTab("lots")}
          className="rounded-full"
        >
          <Sprout className="w-4 h-4 mr-2" /> Création de lot
        </Button>
      </div>

      <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-4 max-w-2xl">
          {activeTab === "params" && <SettingsCard farm={farm} />}
          {activeTab === "lots" && <CreateBatchCard farm={farm} />}
          {activeTab === "varietes" && <TreeTypesCard farm={farm} />}
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
      </CardContent>
    </Card>
  );
}

function TreeTypesCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [nom, setNom] = React.useState("");
  const [rend, setRend] = React.useState("20");

  async function submit() {
    if (!nom.trim()) return;
    await farm.actions.addTreeType(nom.trim(), Number(rend || 0));
    setNom("");
    setRend("20");
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning-foreground">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Variétés d’oliviers</CardTitle>
            <CardDescription>Définissez les types d'arbres et leurs rendements max</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="p-4 rounded-xl border border-border/50 bg-background/40">
          <div className="text-sm font-medium mb-3">Ajouter une nouvelle variété</div>
          <div className="grid grid-cols-[1fr_100px] gap-2 mb-3">
            <Input 
              placeholder="Ex: Koroneiki, Chemlali..." 
              value={nom} 
              onChange={(e) => setNom(e.target.value)} 
              className="bg-background"
            />
            <div className="relative">
              <Input
                inputMode="decimal"
                value={rend}
                onChange={(e) => setRend(e.target.value)}
                className="bg-background pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
                kg
              </div>
            </div>
          </div>
          <Button onClick={submit} className="w-full" disabled={!nom.trim()}>
            Ajouter la variété
          </Button>
        </div>

        <div className="grid gap-2">
          {farm.types.map((t) => (
            <TreeTypeRow key={t.id} t={t} farm={farm} />
          ))}
          {farm.types.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <Trees className="w-8 h-8 text-muted mb-2" />
              <div className="text-sm font-medium">Aucune variété</div>
              <div className="text-xs text-muted mt-1">Ajoutez au moins une variété pour pouvoir créer vos lots.</div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateBatchCard({ farm }: { farm: ReturnType<typeof useFarmData> }) {
  const [nom, setNom] = React.useState("Lot 1");
  const [typeId, setTypeId] = React.useState<string>("");
  const [datePlantation, setDatePlantation] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [nb, setNb] = React.useState<string>("100");
  const [irrig, setIrrig] = React.useState<"irrigue" | "non_irrigue">("non_irrigue");
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
              <option value="non_irrigue">Non irrigué</option>
              <option value="irrigue">Irrigué</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1.5">
          <div className="text-sm font-medium text-foreground/80 flex items-center justify-between">
            <span>État de croissance</span>
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

function TreeTypeRow({ t, farm }: { t: any; farm: ReturnType<typeof useFarmData> }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editNom, setEditNom] = React.useState(t.nom);
  const [editRend, setEditRend] = React.useState(String(t.rendementMaxKgParArbre));

  async function handleSave() {
    if (!editNom.trim()) return;
    await farm.actions.updateTreeType(t.id, {
      nom: editNom.trim(),
      rendementMaxKgParArbre: Number(editRend || 0),
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/5 p-3 animate-in fade-in zoom-in-95">
        <div className="flex-1 grid grid-cols-[1fr_80px] gap-2">
          <Input 
            value={editNom} 
            onChange={e => setEditNom(e.target.value)} 
            className="h-8 text-sm bg-background" 
          />
          <Input 
            inputMode="decimal"
            value={editRend} 
            onChange={e => setEditRend(e.target.value)} 
            className="h-8 text-sm bg-background" 
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={handleSave}>
            <Check className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => {
            setIsEditing(false);
            setEditNom(t.nom);
            setEditRend(String(t.rendementMaxKgParArbre));
          }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card p-3 hover:border-border transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Trees className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold truncate">{t.nom}</div>
          <div className="text-xs text-muted flex items-center gap-1">
            Rendement max: <span className="font-medium text-foreground">{t.rendementMaxKgParArbre} kg</span>
          </div>
        </div>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted hover:text-primary" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => farm.actions.removeTreeType(t.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
