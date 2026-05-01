"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateLong } from "@/lib/format";
import { useFarmData } from "@/lib/useFarmData";
import { Calendar, Plus, Trash2, Edit2, X, Check, CheckCircle2, Clock } from "lucide-react";
import type { TaskStatus, TaskType } from "@/lib/domain";

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  taille: "Taille",
  labour: "Labour",
  traitement: "Traitement",
  irrigation: "Irrigation",
  recolte: "Récolte",
  autre: "Autre",
};

export default function CalendrierPage() {
  const farm = useFarmData();

  const pendingTasks = farm.tasks.filter(t => t.statut !== "termine");
  const completedTasks = farm.tasks.filter(t => t.statut === "termine");

  return (
    <AppShell title="Calendrier & Tâches">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Tâches à venir ({pendingTasks.length})
          </h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm mb-4">
            <CardContent className="p-2">
               <AddTask />
            </CardContent>
          </Card>
          
          <div className="grid gap-2">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((t) => <TaskRow key={t.id} t={t} farm={farm} />)
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-muted/5">
                <CheckCircle2 className="w-8 h-8 text-success/50 mb-3" />
                <div className="text-sm font-medium">Tout est à jour !</div>
                <div className="text-xs text-muted">Aucune tâche en attente.</div>
              </div>
            )}
          </div>
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted">
              <Check className="w-5 h-5" /> Tâches terminées ({completedTasks.length})
            </h2>
            <div className="grid gap-2 opacity-70">
              {completedTasks.map((t) => <TaskRow key={t.id} t={t} farm={farm} />)}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AddTask() {
  const farm = useFarmData();
  const [isAdding, setIsAdding] = React.useState(false);
  
  const [titre, setTitre] = React.useState("");
  const [datePrevue, setDatePrevue] = React.useState(new Date().toISOString().slice(0, 10));
  const [typeTache, setTypeTache] = React.useState<TaskType>("entretien" as any);
  const [lotId, setLotId] = React.useState<string>("");

  async function submit() {
    if (!titre.trim()) return;
    await farm.actions.addTask({
      titre: titre.trim(),
      datePrevueISO: datePrevue,
      statut: "a_faire",
      typeTache: typeTache || "autre",
      lotId: lotId || undefined,
    });
    setTitre("");
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button variant="ghost" className="w-full text-muted justify-start" onClick={() => setIsAdding(true)}>
        <Plus className="w-4 h-4 mr-2" /> Ajouter une tâche...
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2 animate-in fade-in zoom-in-95">
      <Input placeholder="Titre de la tâche..." value={titre} onChange={(e) => setTitre(e.target.value)} className="bg-background" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} className="bg-background" />
        <Select value={typeTache} onChange={(e) => setTypeTache(e.target.value as TaskType)}>
          {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>
      <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
        <option value="">-- Toute la ferme --</option>
        {farm.lots.map((l) => (
          <option key={l.id} value={l.id}>{l.nom}</option>
        ))}
      </Select>
      <div className="flex justify-end gap-2 mt-1">
        <Button variant="ghost" onClick={() => setIsAdding(false)}>Annuler</Button>
        <Button onClick={submit} disabled={!titre.trim()}>Ajouter</Button>
      </div>
    </div>
  );
}

function TaskRow({ t, farm }: { t: any; farm: ReturnType<typeof useFarmData> }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [titre, setTitre] = React.useState(t.titre);
  const [datePrevue, setDatePrevue] = React.useState(t.datePrevueISO);
  const [typeTache, setTypeTache] = React.useState(t.typeTache);
  const [lotId, setLotId] = React.useState(t.lotId || "");

  async function handleSave() {
    if (!titre.trim()) return;
    await farm.actions.updateTask(t.id, {
      titre: titre.trim(),
      datePrevueISO: datePrevue,
      typeTache,
      lotId: lotId || undefined,
    });
    setIsEditing(false);
  }

  async function toggleStatus() {
    const newStatut = t.statut === "termine" ? "a_faire" : "termine";
    await farm.actions.updateTask(t.id, {
      statut: newStatut,
      dateRealiseeISO: newStatut === "termine" ? new Date().toISOString().slice(0, 10) : undefined,
    });
  }

  if (isEditing) {
    return (
      <Card className="border-primary/50 bg-primary/5 animate-in fade-in zoom-in-95">
        <CardContent className="p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">Modifier tâche</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success" onClick={handleSave}><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <Input value={titre} onChange={(e) => setTitre(e.target.value)} className="h-8 bg-background" />
          <div className="grid grid-cols-2 gap-2">
             <Input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} className="h-8 bg-background" />
             <Select value={typeTache} onChange={(e) => setTypeTache(e.target.value)}>
               {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
             </Select>
          </div>
          <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
            <option value="">-- Globale --</option>
            {farm.lots.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </Select>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = t.statut !== "termine" && new Date(t.datePrevueISO) < new Date(new Date().toISOString().slice(0, 10));

  return (
    <Card className={`group border-border/40 hover:border-border transition-colors ${t.statut === "termine" ? "bg-muted/10" : "bg-card/50 backdrop-blur-xl shadow-sm"} ${isOverdue ? "border-danger/30" : ""}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <button 
          onClick={toggleStatus}
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${t.statut === "termine" ? "bg-success border-success text-white" : "border-muted hover:border-primary"}`}
        >
          {t.statut === "termine" && <Check className="w-4 h-4" />}
        </button>
        
        <div className={`flex-1 min-w-0 ${t.statut === "termine" ? "line-through text-muted-foreground" : ""}`}>
          <div className="text-sm font-semibold truncate">{t.titre}</div>
          <div className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className={`flex items-center gap-1 ${isOverdue ? "text-danger font-medium" : "text-muted"}`}>
               <Clock className="w-3 h-3" /> {formatDateLong(t.datePrevueISO)}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted font-medium">{TASK_TYPE_LABELS[t.typeTache as TaskType] || t.typeTache}</span>
            {t.lotId && farm.lots.find(l => l.id === t.lotId) && (
               <>
                 <span className="text-muted">•</span>
                 <span className="text-primary/80 font-medium">{farm.lots.find(l => l.id === t.lotId)?.nom}</span>
               </>
            )}
          </div>
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger" onClick={() => farm.actions.removeTask(t.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
