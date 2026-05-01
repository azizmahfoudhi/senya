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

// Courbe de rendement en cloche (Gompertz simplifiée ou interpolation douce)
// 0-2 ans: 0%
// 3 ans: 5% (premiers fruits)
// 4 ans: 20%
// 5 ans: 45%
// 6 ans: 70%
// 7 ans: 90%
// 8+ ans: 100% du max
function yieldPercentageByAge(ageYears: number) {
  const pts: Array<[number, number]> = [
    [0, 0],
    [2, 0],
    [3, 0.05],
    [4, 0.20],
    [5, 0.45],
    [6, 0.70],
    [7, 0.90],
    [8, 1.00],
    [25, 1.00],
    [30, 0.90], // Déclin très lent pour les vieux arbres
  ];
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
}) {
  const yieldPct = yieldPercentageByAge(args.ageYears);
  const scaled = yieldPct * args.type.rendementMaxKgParArbre;
  
  // L'irrigation a un impact énorme en année sèche, ou un impact standard de +30/40%
  // On considère que le rendement max est atteint SOUS irrigation idéale.
  // Donc si non irrigué, le rendement est diminué drastiquement (ex: -40%).
  const irrigationMultiplier = args.irrigation === "irrigue" ? 1.0 : 0.6;
  
  // Multiplicateur pour l'état de croissance (1-5 étoiles)
  let growthMultiplier = 1.0; // 3 stars
  if (args.growthStatus === 1) growthMultiplier = 0.4;
  if (args.growthStatus === 2) growthMultiplier = 0.7;
  if (args.growthStatus === 4) growthMultiplier = 1.2;
  if (args.growthStatus === 5) growthMultiplier = 1.5;

  return Math.max(0, scaled * irrigationMultiplier * growthMultiplier);
}

export function batchEstimatedProductionKg(args: {
  batch: Batch;
  type: TreeType;
  atISO: string;
}) {
  const ageYears = ageYearsFromISO(args.batch.datePlantationISO, args.atISO);
  const perTree = estimatedYieldKgPerTree({
    type: args.type,
    ageYears,
    irrigation: args.batch.irrigation,
    growthStatus: args.batch.etatCroissance,
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

export function sumRevenuesTotal(state: FarmState) {
  return state.harvests.reduce((acc, h) => acc + (h.revenuGenere || 0), 0);
}

export function sumRevenuesForBatch(state: FarmState, lotId: UUID) {
  return state.harvests
    .filter((h) => h.lotId === lotId)
    .reduce((acc, h) => acc + (h.revenuGenere || 0), 0);
}

export function batchActualROI(state: FarmState, lotId: UUID) {
  const rev = sumRevenuesForBatch(state, lotId);
  const exp = sumExpensesForBatch(state, lotId);
  return rev - exp;
}



export function buildScenarioState(base: FarmState, scenarioId?: UUID) {
  const scenario = base.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return base;

  const lots = [...base.lots, ...scenario.ajoutLots].map((l) => {
    if (scenario.irrigationOnLotIds.includes(l.id)) {
      return { ...l, irrigation: "irrigue" as const };
    }
    if (scenario.irrigationOffLotIds.includes(l.id)) {
      return { ...l, irrigation: "non_irrigue" as const };
    }
    return l;
  });

  return { ...base, lots };
}

