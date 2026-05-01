"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateLong, formatKg, formatMoneyDT } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { Wheat, Plus, Trash2, Edit2, X, Check, Droplet } from "lucide-react";

export default function RecoltesPage() {
  const farm = useFarmData();

  const totalKg = farm.harvests.reduce((acc, h) => acc + h.quantiteKg, 0);
  const totalRev = farm.harvests.reduce((acc, h) => acc + (h.revenuGenere || 0), 0);
  
  // Rendement huile moyen (pondéré par les kg)
  const oilPressings = farm.harvests.filter(h => h.rendementHuilePct != null && h.rendementHuilePct > 0);
  const totalKgOil = oilPressings.reduce((acc, h) => acc + h.quantiteKg, 0);
  const avgOilYield = totalKgOil > 0 
    ? oilPressings.reduce((acc, h) => acc + (h.rendementHuilePct! * h.quantiteKg), 0) / totalKgOil 
    : 0;

  return (
    <AppShell title="Récoltes & Huilerie">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider">Total Récolté</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wheat className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold tracking-tight">
              {formatKg(totalKg)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted uppercase tracking-wider">Revenu Total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
              <span className="font-bold">DT</span>
            </div>
            <div className="text-xl font-bold tracking-tight">
              {formatMoneyDT(totalRev)}
            </div>
          </CardContent>
        </Card>
      </div>

      {avgOilYield > 0 && (
        <Card className="border-warning/50 bg-warning/10 backdrop-blur-xl shadow-sm mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Rendement en Huile Moyen</div>
                <div className="text-xs text-muted">Sur {formatKg(totalKgOil)} d'olives pressées</div>
              </div>
            </div>
            <div className="text-2xl font-black text-warning">
              {avgOilYield.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wheat className="w-5 h-5" /> Saisir une Récolte
          </h2>
          <AddHarvest />
        </div>
      </div>
    </AppShell>
  );
}

function AddHarvest() {
  const farm = useFarmData();
  const [dateISO, setDateISO] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [quantiteKg, setQuantiteKg] = React.useState<string>("");
  const [rendementHuilePct, setRendementHuilePct] = React.useState<string>("");
  const [revenuGenere, setRevenuGenere] = React.useState<string>("");
  const [lotId, setLotId] = React.useState<string>("");

  async function submit() {
    if (!quantiteKg || Number(quantiteKg) <= 0) return;
    await farm.actions.addHarvest({
      dateISO,
      quantiteKg: Number(quantiteKg),
      rendementHuilePct: rendementHuilePct ? Number(rendementHuilePct) : undefined,
      revenuGenere: revenuGenere ? Number(revenuGenere) : undefined,
      lotId: lotId || undefined,
    });
    setQuantiteKg("");
    setRendementHuilePct("");
    setRevenuGenere("");
  }

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm h-fit">
        <CardHeader>
          <div>
            <CardTitle>Nouvelle récolte</CardTitle>
            <CardDescription>Ajoutez les détails de votre récolte ou trituration.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="grid gap-1.5">
            <div className="text-sm font-medium text-foreground/80">Quantité (Olives)</div>
            <div className="relative">
              <Input inputMode="decimal" value={quantiteKg} onChange={(e) => setQuantiteKg(e.target.value)} placeholder="0" className="pr-10 bg-background/50" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">kg</div>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Rendement Huile (Optionnel)</div>
              <div className="relative">
                <Input inputMode="decimal" value={rendementHuilePct} onChange={(e) => setRendementHuilePct(e.target.value)} placeholder="18.5" className="pr-8 bg-background/50" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">%</div>
              </div>
            </label>
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Revenu généré</div>
              <div className="relative">
                <Input inputMode="decimal" value={revenuGenere} onChange={(e) => setRevenuGenere(e.target.value)} placeholder="0.00" className="pr-10 bg-background/50" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">DT</div>
              </div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Date</div>
              <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="bg-background/50" />
            </label>
            <label className="grid gap-1.5">
              <div className="text-sm font-medium text-foreground/80">Lot concerné</div>
              <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
                <option value="">-- Toute la ferme --</option>
                {farm.lots.map((l) => (
                  <option key={l.id} value={l.id}>{l.nom}</option>
                ))}
              </Select>
            </label>
          </div>
          <Button onClick={submit} disabled={!quantiteKg || Number(quantiteKg) <= 0} className="w-full gap-2 mt-2">
            <Plus className="w-4 h-4" /> Enregistrer la récolte
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div>
            <CardTitle>Historique des récoltes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {farm.harvests.map((h) => (
            <HarvestRow key={h.id} h={h} farm={farm} />
          ))}
          {farm.harvests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-muted/5">
              <Wheat className="w-8 h-8 text-muted mb-3" />
              <div className="text-sm font-medium">Aucune récolte enregistrée</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function HarvestRow({ h, farm }: { h: any; farm: ReturnType<typeof useFarmData> }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [quantiteKg, setQuantiteKg] = React.useState(String(h.quantiteKg));
  const [rendementHuilePct, setRendementHuilePct] = React.useState(h.rendementHuilePct ? String(h.rendementHuilePct) : "");
  const [revenuGenere, setRevenuGenere] = React.useState(h.revenuGenere ? String(h.revenuGenere) : "");
  const [dateISO, setDateISO] = React.useState(h.dateISO);
  const [lotId, setLotId] = React.useState(h.lotId || "");

  async function handleSave() {
    if (!quantiteKg || Number(quantiteKg) <= 0) return;
    await farm.actions.updateHarvest(h.id, {
      quantiteKg: Number(quantiteKg),
      rendementHuilePct: rendementHuilePct ? Number(rendementHuilePct) : undefined,
      revenuGenere: revenuGenere ? Number(revenuGenere) : undefined,
      dateISO,
      lotId: lotId || undefined,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-primary/50 bg-primary/5 p-3 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Modifier récolte</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" onClick={handleSave}><Check className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input inputMode="decimal" value={quantiteKg} onChange={e => setQuantiteKg(e.target.value)} className="h-8 bg-background" placeholder="Kg" />
          <Input inputMode="decimal" value={rendementHuilePct} onChange={e => setRendementHuilePct(e.target.value)} className="h-8 bg-background" placeholder="Rend. %" />
          <Input inputMode="decimal" value={revenuGenere} onChange={e => setRevenuGenere(e.target.value)} className="h-8 bg-background" placeholder="Revenu DT" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateISO} onChange={e => setDateISO(e.target.value)} className="h-8 bg-background" />
          <Select value={lotId} onChange={e => setLotId(e.target.value)}>
            <option value="">-- Globale --</option>
            {farm.lots.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-background/40 p-3 hover:border-border transition-colors">
      <div className="flex gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Wheat className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold">{formatKg(h.quantiteKg)}</div>
          <div className="text-xs text-muted mt-0.5">
            {formatDateLong(h.dateISO)}
            {h.lotId && farm.lots.find(l => l.id === h.lotId) ? ` · ${farm.lots.find(l => l.id === h.lotId)?.nom}` : " · Globale"}
          </div>
          {(h.rendementHuilePct || h.revenuGenere) && (
            <div className="mt-1 flex items-center gap-2">
              {h.rendementHuilePct && (
                <span className="inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                  <Droplet className="w-3 h-3" /> {h.rendementHuilePct}%
                </span>
              )}
              {h.revenuGenere && (
                <span className="inline-flex items-center gap-1 rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-medium text-success">
                  {formatMoneyDT(h.revenuGenere)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => farm.actions.removeHarvest(h.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
