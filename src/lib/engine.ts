import { addMonths, differenceInMonths, parseISO } from "date-fns";
import type {
  Batch,
  FarmState,
  IrrigationStatus,
  RecurringExpense,
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
}) {
  const yieldPct = yieldPercentageByAge(args.ageYears);
  const scaled = yieldPct * args.type.rendementMaxKgParArbre;
  
  // L'irrigation a un impact énorme en année sèche, ou un impact standard de +30/40%
  // On considère que le rendement max est atteint SOUS irrigation idéale.
  // Donc si non irrigué, le rendement est diminué drastiquement (ex: -40%).
  const irrigationMultiplier = args.irrigation === "irrigue" ? 1.0 : 0.6;
  return Math.max(0, scaled * irrigationMultiplier);
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

export function recurringMonthlyTotal(state: FarmState) {
  return state.recurrents.reduce((acc, r) => acc + r.montantMensuel, 0);
}

export function recurringMonthlyForBatch(state: FarmState, lotId: UUID) {
  return state.recurrents
    .filter((r) => r.lotId === lotId)
    .reduce((acc, r) => acc + r.montantMensuel, 0);
}

export function expandRecurringToMonthlyCosts(args: {
  recurrents: RecurringExpense[];
  fromISO: string;
  toISO: string;
}) {
  // Retourne des points mensuels (ISO du 1er jour) -> montant
  const from = parseISO(args.fromISO);
  const to = parseISO(args.toISO);
  const months = Math.max(0, differenceInMonths(to, from));
  const points: Array<{ monthISO: string; montant: number }> = [];

  for (let i = 0; i <= months; i++) {
    const d = addMonths(from, i);
    const monthISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-01`;
    let montant = 0;
    for (const r of args.recurrents) {
      const startOk = parseISO(r.debutISO) <= d;
      const endOk = !r.finISO || parseISO(r.finISO) >= d;
      if (startOk && endOk) montant += r.montantMensuel;
    }
    points.push({ monthISO, montant });
  }
  return points;
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

  const recurrents = scenario.coutMensuelIrrigationAdditionnel
    ? [
        ...base.recurrents,
        {
          id: `scenario-irrig-${scenario.id}`,
          nom: `Irrigation (scénario)`,
          montantMensuel: scenario.coutMensuelIrrigationAdditionnel,
          categorie: "irrigation" as const,
          debutISO: new Date().toISOString().slice(0, 10),
        },
      ]
    : base.recurrents;

  return { ...base, lots, recurrents };
}

