import { v4 as uuid } from "uuid";
import type { FarmState } from "@/lib/domain";

export function demoSeed(): FarmState {
  const typeKor = { id: uuid(), nom: "Koroneiki", rendementMaxKgParArbre: 25 };
  const typeChe = { id: uuid(), nom: "Chemlali", rendementMaxKgParArbre: 20 };

  const lot1 = {
    id: uuid(),
    nom: "Lot A (colline)",
    typeId: typeKor.id,
    datePlantationISO: "2021-02-15",
    nbArbres: 320,
    irrigation: "irrigue" as const,
  };
  const lot2 = {
    id: uuid(),
    nom: "Lot B (plaine)",
    typeId: typeChe.id,
    datePlantationISO: "2018-11-01",
    nbArbres: 450,
    irrigation: "non_irrigue" as const,
  };

  return {
    settings: { surfaceHa: 8, prixKgOlives: 6.5 },
    types: [typeKor, typeChe],
    lots: [lot1, lot2],
    depenses: [
      {
        id: uuid(),
        dateISO: "2021-02-20",
        montant: 24000,
        categorie: "plantation",
        lotId: lot1.id,
        note: "Plants + plantation",
      },
      {
        id: uuid(),
        dateISO: "2022-06-10",
        montant: 5500,
        categorie: "equipement",
        note: "Petite motopompe",
      },
      {
        id: uuid(),
        dateISO: "2024-09-01",
        montant: 4200,
        categorie: "entretien",
        lotId: lot2.id,
        note: "Taille + traitement",
      },
    ],
    harvests: [],
    tasks: [],
    treatments: [],
    scenarios: [
      {
        id: uuid(),
        nom: "Ajouter 200 arbres irrigués",
        ajoutLots: [
          {
            id: uuid(),
            nom: "Nouveau lot (scénario)",
            typeId: typeKor.id,
            datePlantationISO: new Date().toISOString().slice(0, 10),
            nbArbres: 200,
            irrigation: "irrigue" as const,
          },
        ],
        irrigationOnLotIds: [],
        irrigationOffLotIds: [],
        coutMensuelIrrigationAdditionnel: 450,
      },
    ],
  };
}

