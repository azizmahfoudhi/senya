import type {
  Batch,
  Expense,
  FarmSettings,
  IrrigationStatus,
  Scenario,
  TreeType,
  UUID,
} from "@/lib/domain";
import { supabaseBrowser } from "@/lib/supabaseClient";

type DbSettingsRow = {
  id: UUID;
  surface_ha: number;
  prix_kg_olives: number;
};

type DbTypeRow = {
  id: UUID;
  nom: string;
  rendement_max_kg_par_arbre: number;
};

type DbBatchRow = {
  id: UUID;
  nom: string;
  type_id: UUID;
  date_plantation: string; // yyyy-MM-dd
  nb_arbres: number;
  irrigation: IrrigationStatus;
};

type DbExpenseRow = {
  id: UUID;
  date: string;
  montant: number;
  categorie: string;
  lot_id: UUID | null;
  note: string | null;
};



type DbScenarioRow = {
  id: UUID;
  nom: string;
  payload: Scenario;
};

function mapSettings(r: DbSettingsRow): FarmSettings {
  return { surfaceHa: Number(r.surface_ha), prixKgOlives: Number(r.prix_kg_olives) };
}
function mapType(r: DbTypeRow): TreeType {
  return { id: r.id, nom: r.nom, rendementMaxKgParArbre: Number(r.rendement_max_kg_par_arbre) };
}
function mapBatch(r: DbBatchRow): Batch {
  return {
    id: r.id,
    nom: r.nom,
    typeId: r.type_id,
    datePlantationISO: r.date_plantation,
    nbArbres: Number(r.nb_arbres),
    irrigation: r.irrigation,
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

export async function getOrCreateSettings(): Promise<{ rowId: UUID; settings: FarmSettings }> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("farm_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (data) return { rowId: (data as any).id, settings: mapSettings(data as any) };

  const { data: created, error: e2 } = await sb
    .from("farm_settings")
    .insert({ surface_ha: 0, prix_kg_olives: 0 })
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
  const { error } = await sb.from("farm_settings").update(payload).eq("id", rowId);
  if (error) throw error;
}

export async function listTreeTypes(): Promise<TreeType[]> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("tree_types").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map(mapType);
}

export async function createTreeType(input: { nom: string; rendementMaxKgParArbre: number }) {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("tree_types")
    .insert({
      nom: input.nom,
      rendement_max_kg_par_arbre: input.rendementMaxKgParArbre,
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



