export type UUID = string;

export type IrrigationStatus = "irrigue" | "non_irrigue";

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
export type Harvest = {
  id: UUID;
  lotId?: UUID; // Si null, c'est une récolte globale
  dateISO: string;
  quantiteKg: number;
  rendementHuilePct?: number; // ex: 18.5
  revenuGenere?: number;
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


export type FarmSettings = {
  surfaceHa: number;
  prixKgOlives: number;
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
  harvests: Harvest[];
  tasks: FarmTask[];
  treatments: Treatment[];

  scenarios: Scenario[];
};

