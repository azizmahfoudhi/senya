import type {
  Batch,
  Expense,
  FarmSettings,
  FarmTask,
  IrrigationStatus,
  Scenario,
  TreeType,
  Treatment,
  YieldRecord,
  UUID,
} from "@/lib/domain";
import { supabaseBrowser } from "@/lib/supabaseClient";

type DbSettingsRow = {
  id: UUID;
  surface_ha: number;
  prix_kg_olives: number;
  pluviometrie_annuelle_mm: number | null;
};

type DbTypeRow = {
  id: UUID;
  nom: string;
  rendement_max_kg_par_arbre: number;
  is_intensive: boolean;
};

type DbBatchRow = {
  id: UUID;
  nom: string;
  type_id: UUID;
  date_plantation: string; // yyyy-MM-dd
  nb_arbres: number;
  irrigation: IrrigationStatus;
  etat_croissance: string | null;
  stress_level: string | null;
};

type DbExpenseRow = {
  id: UUID;
  date: string;
  montant: number;
  categorie: string;
  lot_id: UUID | null;
  note: string | null;
};



type DbTaskRow = {
  id: UUID;
  titre: string;
  date_prevue: string;
  date_realisee: string | null;
  statut: string;
  type_tache: string;
  lot_id: UUID | null;
};

type DbTreatmentRow = {
  id: UUID;
  lot_id: UUID;
  date: string;
  maladie: string;
  produit: string;
  notes: string | null;
};

type DbScenarioRow = {
  id: UUID;
  nom: string;
  payload: Scenario;
};

function mapSettings(r: DbSettingsRow): FarmSettings {
  return { 
    surfaceHa: Number(r.surface_ha), 
    prixKgOlives: Number(r.prix_kg_olives),
    pluviometrieAnnuelleMm: r.pluviometrie_annuelle_mm != null ? Number(r.pluviometrie_annuelle_mm) : 300
  };
}
function mapType(r: DbTypeRow): TreeType {
  return { 
    id: r.id, 
    nom: r.nom, 
    rendementMaxKgParArbre: Number(r.rendement_max_kg_par_arbre),
    isIntensive: Boolean(r.is_intensive) 
  };
}
function mapBatch(r: DbBatchRow): Batch {
  return {
    id: r.id,
    nom: r.nom,
    typeId: r.type_id,
    datePlantationISO: r.date_plantation,
    nbArbres: Number(r.nb_arbres),
    irrigation: r.irrigation,
    etatCroissance: isNaN(Number(r.etat_croissance)) ? 3 : Number(r.etat_croissance) || 3,
    stressLevel: (r.stress_level as any) || "bas",
  };
}
function mapExpense(r: DbExpenseRow): Expense {
  return {
    id: r.id,
    dateISO: r.date,
    montant: Number(r.montant),
    categorie: r.categorie as any,
    lotId: r.lot_id ?? undefined,
    note: r.note ?? undefined,
  };
}

function mapScenario(r: DbScenarioRow): Scenario {
  return { id: r.id, nom: r.nom, ...(r.payload as any) };
}


function mapTask(r: any): FarmTask {
  return {
    id: r.id,
    titre: r.titre,
    datePrevueISO: r.date_prevue,
    dateRealiseeISO: r.date_realisee ?? undefined,
    statut: r.statut as any,
    typeTache: r.type_tache as any,
    lotId: r.lot_id ?? undefined,
  };
}

function mapTreatment(r: any): Treatment {
  return {
    id: r.id,
    lotId: r.lot_id,
    dateISO: r.date,
    maladie: r.maladie,
    produit: r.produit,
    notes: r.notes ?? undefined,
  };
}

function mapYield(r: any) {
  return {
    id: r.id,
    lotId: r.lot_id,
    quantiteKg: Number(r.quantite_kg),
    dateISO: r.annee ? `${r.annee}-01-01` : "2000-01-01", // fallback if db is different
    rendementHuilePct: r.rendement_huile_pct ? Number(r.rendement_huile_pct) : undefined,
    note: r.note ?? undefined,
  };
}

export async function getOrCreateSettings(): Promise<{ rowId: UUID; settings: FarmSettings }> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("farm_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (data) return { rowId: (data as any).id, settings: mapSettings(data as any) };

  const { data: created, error: e2 } = await sb
    .from("farm_settings")
    .insert({ surface_ha: 0, prix_kg_olives: 0, pluviometrie_annuelle_mm: 300 })
    .select("*")
    .single();
  if (e2) throw e2;
  return { rowId: (created as any).id, settings: mapSettings(created as any) };
}

export async function updateSettings(rowId: UUID, patch: Partial<FarmSettings>) {
  const sb = supabaseBrowser();
  const payload: Partial<DbSettingsRow> = {};
  if (patch.surfaceHa !== undefined) payload.surface_ha = patch.surfaceHa;
  if (patch.prixKgOlives !== undefined) payload.prix_kg_olives = patch.prixKgOlives;
  if (patch.pluviometrieAnnuelleMm !== undefined) payload.pluviometrie_annuelle_mm = patch.pluviometrieAnnuelleMm;
  const { error } = await sb.from("farm_settings").update(payload).eq("id", rowId);
  if (error) throw error;
}

export async function listTreeTypes(): Promise<TreeType[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("tree_types").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapType);
}

export async function createTreeType(input: { nom: string; rendementMaxKgParArbre: number; isIntensive: boolean }) {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("tree_types")
    .insert({
      nom: input.nom,
      rendement_max_kg_par_arbre: input.rendementMaxKgParArbre,
      is_intensive: input.isIntensive,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapType(data as any);
}

export async function deleteTreeType(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("tree_types").delete().eq("id", id);
  if (error) throw error;
}

export async function listBatches(): Promise<Batch[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("batches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapBatch);
}

export async function createBatch(input: Omit<Batch, "id">) {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("batches")
    .insert({
      nom: input.nom,
      type_id: input.typeId,
      date_plantation: input.datePlantationISO,
      nb_arbres: input.nbArbres,
      irrigation: input.irrigation,
      etat_croissance: input.etatCroissance ?? 3,
      stress_level: input.stressLevel ?? "bas",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapBatch(data as any);
}

export async function deleteBatch(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("batches").delete().eq("id", id);
  if (error) throw error;
}

export async function listExpenses(): Promise<Expense[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("expenses").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapExpense);
}

export async function createExpense(input: Omit<Expense, "id">) {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("expenses")
    .insert({
      date: input.dateISO,
      montant: input.montant,
      categorie: input.categorie,
      lot_id: input.lotId ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapExpense(data as any);
}

export async function deleteExpense(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function listYields(): Promise<YieldRecord[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("yields").select("*");
  if (error) throw error;
  return (data as any[]).map(mapYield);
}

export async function createYield(input: Omit<YieldRecord, "id">) {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("yields")
    .insert({
      lot_id: input.lotId,
      quantite_kg: input.quantiteKg,
      annee: new Date(input.dateISO).getFullYear().toString(),
      rendement_huile_pct: input.rendementHuilePct ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapYield(data as any);
}

export async function deleteYield(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("yields").delete().eq("id", id);
  if (error) throw error;
}

export async function listScenarios(): Promise<Scenario[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("scenarios").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapScenario);
}

export async function updateTreeType(id: UUID, input: Partial<Omit<TreeType, "id">>) {
  const sb = supabaseBrowser();
  const payload: any = {};
  if (input.nom !== undefined) payload.nom = input.nom;
  if (input.rendementMaxKgParArbre !== undefined) payload.rendement_max_kg_par_arbre = input.rendementMaxKgParArbre;
  if (input.isIntensive !== undefined) payload.is_intensive = input.isIntensive;
  const { error } = await sb.from("tree_types").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateBatch(id: UUID, input: Partial<Omit<Batch, "id">>) {
  const sb = supabaseBrowser();
  const payload: any = {};
  if (input.nom !== undefined) payload.nom = input.nom;
  if (input.typeId !== undefined) payload.type_id = input.typeId;
  if (input.datePlantationISO !== undefined) payload.date_plantation = input.datePlantationISO;
  if (input.nbArbres !== undefined) payload.nb_arbres = input.nbArbres;
  if (input.irrigation !== undefined) payload.irrigation = input.irrigation;
  if (input.etatCroissance !== undefined) payload.etat_croissance = input.etatCroissance;
  if (input.stressLevel !== undefined) payload.stress_level = input.stressLevel;
  const { error } = await sb.from("batches").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateExpense(id: UUID, input: Partial<Omit<Expense, "id">>) {
  const sb = supabaseBrowser();
  const payload: any = {};
  if (input.dateISO !== undefined) payload.date = input.dateISO;
  if (input.montant !== undefined) payload.montant = input.montant;
  if (input.categorie !== undefined) payload.categorie = input.categorie;
  if (input.lotId !== undefined) payload.lot_id = input.lotId;
  if (input.note !== undefined) payload.note = input.note;
  const { error } = await sb.from("expenses").update(payload).eq("id", id);
  if (error) throw error;
}

// TASKS
export async function listTasks(): Promise<FarmTask[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("tasks").select("*").order("date_prevue", { ascending: true });
  if (error) throw error;
  return (data as any[]).map(mapTask);
}

export async function createTask(input: Omit<FarmTask, "id">) {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("tasks").insert({
    titre: input.titre,
    date_prevue: input.datePrevueISO,
    date_realisee: input.dateRealiseeISO ?? null,
    statut: input.statut,
    type_tache: input.typeTache,
    lot_id: input.lotId ?? null,
  }).select("*").single();
  if (error) throw error;
  return mapTask(data as any);
}

export async function updateTask(id: UUID, input: Partial<Omit<FarmTask, "id">>) {
  const sb = supabaseBrowser();
  const payload: any = {};
  if (input.titre !== undefined) payload.titre = input.titre;
  if (input.datePrevueISO !== undefined) payload.date_prevue = input.datePrevueISO;
  if (input.dateRealiseeISO !== undefined) payload.date_realisee = input.dateRealiseeISO;
  if (input.statut !== undefined) payload.statut = input.statut;
  if (input.typeTache !== undefined) payload.type_tache = input.typeTache;
  if (input.lotId !== undefined) payload.lot_id = input.lotId;
  const { error } = await sb.from("tasks").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// TREATMENTS
export async function listTreatments(): Promise<Treatment[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("treatments").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapTreatment);
}

export async function createTreatment(input: Omit<Treatment, "id">) {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("treatments").insert({
    lot_id: input.lotId,
    date: input.dateISO,
    maladie: input.maladie,
    produit: input.produit,
    notes: input.notes ?? null,
  }).select("*").single();
  if (error) throw error;
  return mapTreatment(data as any);
}

export async function updateTreatment(id: UUID, input: Partial<Omit<Treatment, "id">>) {
  const sb = supabaseBrowser();
  const payload: any = {};
  if (input.lotId !== undefined) payload.lot_id = input.lotId;
  if (input.dateISO !== undefined) payload.date = input.dateISO;
  if (input.maladie !== undefined) payload.maladie = input.maladie;
  if (input.produit !== undefined) payload.produit = input.produit;
  if (input.notes !== undefined) payload.notes = input.notes;
  const { error } = await sb.from("treatments").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteTreatment(id: UUID) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("treatments").delete().eq("id", id);
  if (error) throw error;
}



