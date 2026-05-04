export type UUID = string;

export type IrrigationStatus = "non_irrigue" | "faible" | "normal" | "optimal";

export type ExpenseCategory =
  | "plantation"
  | "main_oeuvre"
  | "transport"
  | "irrigation"
  | "equipement"
  | "entretien"
  | "autre";

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  plantation: "Plantation",
  main_oeuvre: "Main d’œuvre",
  transport: "Transport",
  irrigation: "Irrigation",
  equipement: "Équipement",
  entretien: "Entretien",
  autre: "Autre",
};

export type TreeType = {
  id: UUID;
  nom: string;
  rendementMaxKgParArbre: number; // à maturité
  isIntensive: boolean;
};

export type Batch = {
  id: UUID;
  nom: string;
  typeId: UUID;
  datePlantationISO: string; // yyyy-MM-dd
  nbArbres: number;
  irrigation: IrrigationStatus;
  etatCroissance?: number; // 1 to 5 stars
};

export type Expense = {
  id: UUID;
  dateISO: string; // yyyy-MM-dd
  montant: number;
  categorie: ExpenseCategory;
  lotId?: UUID;
  note?: string;
};

export type TaskStatus = "a_faire" | "en_cours" | "termine";
export type TaskType = "taille" | "labour" | "traitement" | "irrigation" | "recolte" | "autre";

export type FarmTask = {
  id: UUID;
  titre: string;
  datePrevueISO: string;
  dateRealiseeISO?: string;
  statut: TaskStatus;
  typeTache: TaskType;
  lotId?: UUID;
};

export type Treatment = {
  id: UUID;
  lotId: UUID;
  dateISO: string;
  maladie: string;
  produit: string;
  notes?: string;
};

export type YieldRecord = {
  id: UUID;
  lotId: UUID;
  quantiteKg: number;
  dateISO: string;
  rendementHuilePct?: number;
  note?: string;
};

export type FarmSettings = {
  surfaceHa: number;
  prixKgOlives: number;
  pluviometrieAnnuelleMm?: number;
};

export type Scenario = {
  id: UUID;
  nom: string;
  // modifications simplifiées: ajout d’un lot et/ou bascule irrigation
  ajoutLots: Batch[];
  irrigationOnLotIds: UUID[];
  irrigationOffLotIds: UUID[];
  coutMensuelIrrigationAdditionnel: number; // optionnel, global
};

export type FarmState = {
  settings: FarmSettings;
  types: TreeType[];
  lots: Batch[];
  depenses: Expense[];
  yields: YieldRecord[];
  tasks: FarmTask[];
  treatments: Treatment[];

  scenarios: Scenario[];
};
