import { addMonths, differenceInMonths, parseISO } from "date-fns";
import type {
  Batch,
  FarmState,
  IrrigationStatus,
  TreeType,
  UUID,
} from "@/lib/domain";

export function ageYearsFromISO(datePlantationISO: string, atISO: string) {
  const months = differenceInMonths(parseISO(atISO), parseISO(datePlantationISO));
  return Math.max(0, months / 12);
}

function yieldPercentageByAge(ageYears: number, type: TreeType) {
  let pts: Array<[number, number]>;

  if (!type.isIntensive) {
    // Variétés traditionnelles (Chemlali, Chétoui) : entrée en production tardive, pic tardif
    pts = [
      [0, 0],
      [4, 0],       // Rien avant 4 ans
      [5, 0.05],    // Premiers fruits à 5 ans
      [6, 0.15],
      [8, 0.40],
      [10, 0.75],
      [12, 1.00],   // Pic à 12 ans
      [40, 1.00],   // Longue durée de vie
      [50, 0.90],
    ];
  } else {
    // Variétés intensives (Koroneiki, Arbequina) : entrée très rapide, pic rapide
    pts = [
      [0, 0],
      [2, 0],
      [3, 0.10],    // Premiers fruits à 3 ans
      [4, 0.40],
      [5, 0.70],
      [6, 0.90],
      [7, 1.00],    // Pic à 7 ans
      [20, 1.00],
      [25, 0.85],   // Déclin plus rapide
    ];
  }

  const a = Math.max(0, ageYears);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[i + 1]!;
    if (a >= x1 && a <= x2) {
      const t = x2 === x1 ? 0 : (a - x1) / (x2 - x1);
      // Lissage cubique simple pour des transitions douces : 3t^2 - 2t^3
      const smoothT = t * t * (3 - 2 * t);
      return y1 + smoothT * (y2 - y1);
    }
  }
  return pts[pts.length - 1]![1];
}

export function estimatedYieldKgPerTree(args: {
  type: TreeType;
  ageYears: number;
  irrigation: IrrigationStatus;
  growthStatus?: number;
  rainMm?: number;
  stressLevel?: import("./domain").StressLevel;
}) {
  const yieldPct = yieldPercentageByAge(args.ageYears, args.type);
  const scaled = yieldPct * args.type.rendementMaxKgParArbre;
  
  // L'irrigation a un impact énorme en année sèche, ou un impact standard de +30/40%
  let irrigationMultiplier = 0.6;
  if (args.irrigation === "optimal") irrigationMultiplier = 1.0;
  else if (args.irrigation === "normal") irrigationMultiplier = 0.9;
  else if (args.irrigation === "faible") irrigationMultiplier = 0.7;

  // Bonus pluie
  const rain = args.rainMm ?? 300;
  if (args.irrigation === "normal") {
    if (rain >= 400) irrigationMultiplier += 0.05;
  } else if (args.irrigation === "faible") {
    if (rain >= 400) irrigationMultiplier += 0.15;
    else if (rain >= 300) irrigationMultiplier += 0.05;
  } else if (args.irrigation === "non_irrigue") {
    if (rain >= 400) irrigationMultiplier += 0.20; // 0.80 max
    else if (rain >= 300) irrigationMultiplier += 0.10; // 0.70
  }
  
  irrigationMultiplier = Math.min(1.0, irrigationMultiplier);
  
  // Multiplicateur pour l'état de croissance (1-5 étoiles)
  let growthMultiplier = 1.0; // 3 stars
  if (args.growthStatus === 1) growthMultiplier = 0.4;
  if (args.growthStatus === 2) growthMultiplier = 0.7;
  if (args.growthStatus === 4) growthMultiplier = 1.2;
  if (args.growthStatus === 5) growthMultiplier = 1.5;
  
  // Multiplicateur Stress (Impact direct sur la santé de l'arbre)
  let stressMultiplier = 1.0;
  if (args.stressLevel === "moyen") stressMultiplier = 0.7;
  else if (args.stressLevel === "eleve") stressMultiplier = 0.4;

  return Math.max(0, scaled * irrigationMultiplier * growthMultiplier * stressMultiplier);
}

export function batchEstimatedProductionKg(args: {
  batch: Batch;
  type: TreeType;
  atISO: string;
  rainMm?: number;
}) {
  const ageYears = ageYearsFromISO(args.batch.datePlantationISO, args.atISO);
  const perTree = estimatedYieldKgPerTree({
    type: args.type,
    ageYears,
    irrigation: args.batch.irrigation,
    growthStatus: args.batch.etatCroissance,
    rainMm: args.rainMm,
    stressLevel: args.batch.stressLevel,
  });
  return perTree * args.batch.nbArbres;
}

export function sumExpensesTotal(state: FarmState) {
  return state.depenses.reduce((acc, e) => acc + e.montant, 0);
}

export function sumExpensesForBatch(state: FarmState, lotId: UUID) {
  return state.depenses
    .filter((e) => e.lotId === lotId)
    .reduce((acc, e) => acc + e.montant, 0);
}

export function buildScenarioState(base: FarmState, scenarioId?: UUID) {
  const scenario = base.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return base;

  const lots = [...base.lots, ...scenario.ajoutLots].map((l) => {
    if (scenario.irrigationOnLotIds.includes(l.id)) {
      return { ...l, irrigation: "optimal" as const };
    }
    if (scenario.irrigationOffLotIds.includes(l.id)) {
      return { ...l, irrigation: "non_irrigue" as const };
    }
    return l;
  });

  return { ...base, lots };
}

