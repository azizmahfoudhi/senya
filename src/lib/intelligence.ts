import { FarmState, UUID } from "@/lib/domain";
import { batchEstimatedProductionKg, sumExpensesForBatch } from "@/lib/engine";

export type HealthScore = {
  total: number; // 0 - 100
  label: string; // "Critique", "Moyen", "Stable", "Excellent"
  colorClass: string;
  weakestPillar: string;
  breakdown: {
    yield: number; // /100
    water: number; // /100
    financial: number; // /100
    operations: number; // /100
    stress: number; // /100
  };
};

export type LotForecast = {
  yieldKg: number;
  costDt: number;
  profitDt: number;
  confidence: "Low" | "Medium" | "High";
  risks: string[];
};

/**
 * Helper to clamp values between 0 and 100
 */
const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val)));

/**
 * 1. Farm Health Score (Unified Intelligence Index)
 */
export function computeLotHealth(state: FarmState, lotId: UUID): HealthScore {
  const lot = state.lots.find((l) => l.id === lotId);
  const type = state.types.find((t) => t.id === lot?.typeId);
  if (!lot || !type) return fallbackHealth();

  const nowISO = new Date().toISOString();

  // --- 1. Yield Performance (30%) ---
  // Compares estimated yield vs theoretical maximum based on age
  const estimatedYield = batchEstimatedProductionKg({ batch: lot, type, atISO: nowISO });
  const theoreticalMax = lot.nbArbres * type.rendementMaxKgParArbre;
  let yieldScore = theoreticalMax > 0 ? (estimatedYield / theoreticalMax) * 100 : 0;
  // If lot is very young (age < 3), score shouldn't be 0, it should just be neutral 100 because it's growing perfectly if stars are 3+
  const growth = lot.etatCroissance ?? 3;
  if (estimatedYield === 0 && growth >= 3) {
    yieldScore = 80 + (growth - 3) * 10;
  }
  yieldScore = clamp(yieldScore);

  // --- 2. Water Efficiency (20%) ---
  // Based on irrigation status and growth state
  let waterScore = 50;
  if (lot.irrigation === "irrigue") {
    waterScore = 90;
    if (growth < 3) waterScore = 70; // Irrigated but poor growth = bad efficiency
  } else {
    waterScore = growth >= 3 ? 80 : 40; // Dry but good growth = great efficiency
  }
  waterScore = clamp(waterScore);

  // --- 3. Financial Efficiency (20%) ---
  const currentCost = sumExpensesForBatch(state, lotId);
  const revenue = estimatedYield * (state.settings.prixKgOlives || 1);
  const margin = revenue - currentCost;
  let finScore = 50;
  if (revenue > 0) {
    const marginPct = margin / revenue;
    finScore = 50 + (marginPct * 100); // 0 margin = 50, 50% margin = 100
  } else if (currentCost === 0) {
    finScore = 100; // No costs, no revenue = neutral
  } else {
    finScore = 30; // Costs but no revenue (yet)
  }
  finScore = clamp(finScore);

  // --- 4. Operational Health (15%) ---
  const lotTasks = state.tasks.filter(t => t.lotId === lotId);
  let opScore = 100;
  if (lotTasks.length > 0) {
    const overdue = lotTasks.filter(t => t.statut !== "termine" && new Date(t.datePrevueISO) < new Date()).length;
    opScore = clamp(100 - (overdue / lotTasks.length) * 100);
  }

  // --- 5. Environmental Stress (15%) ---
  // Based on treatments and lot health
  const lotTreatments = state.treatments.filter(t => t.lotId === lotId);
  // More treatments = more stress history
  let stressScore = 100 - (lotTreatments.length * 10);
  if (growth < 3) stressScore -= 20;
  stressScore = clamp(stressScore);

  // --- Total Calculation ---
  const total = clamp(
    (yieldScore * 0.30) +
    (waterScore * 0.20) +
    (finScore * 0.20) +
    (opScore * 0.15) +
    (stressScore * 0.15)
  );

  // Find weakest pillar
  const pillars = {
    Yield: yieldScore,
    Water: waterScore,
    Financial: finScore,
    Operations: opScore,
    Stress: stressScore
  };
  const weakestPillar = Object.entries(pillars).sort((a, b) => a[1] - b[1])[0]![0];

  let label = "Excellent";
  let colorClass = "text-success";
  if (total < 40) { label = "Critique"; colorClass = "text-danger"; }
  else if (total < 60) { label = "Moyen"; colorClass = "text-warning-foreground"; }
  else if (total < 80) { label = "Stable"; colorClass = "text-primary"; }

  return {
    total,
    label,
    colorClass,
    weakestPillar,
    breakdown: {
      yield: yieldScore,
      water: waterScore,
      financial: finScore,
      operations: opScore,
      stress: stressScore,
    }
  };
}

function fallbackHealth(): HealthScore {
  return {
    total: 0, label: "Inconnu", colorClass: "text-muted", weakestPillar: "N/A",
    breakdown: { yield: 0, water: 0, financial: 0, operations: 0, stress: 0 }
  };
}


/**
 * 2. Prediction Engine (Senya Forecasting Module)
 */
export function computeLotForecast(state: FarmState, lotId: UUID): LotForecast {
  const lot = state.lots.find((l) => l.id === lotId);
  const type = state.types.find((t) => t.id === lot?.typeId);
  if (!lot || !type) return { yieldKg: 0, costDt: 0, profitDt: 0, confidence: "Low", risks: [] };

  const now = new Date();
  let targetYear = now.getFullYear();
  // Si on est en Décembre (11), la prochaine récolte est l'année suivante
  if (now.getMonth() >= 11) {
    targetYear += 1;
  }
  const harvestISO = `${targetYear}-11-01T00:00:00.000Z`;
  
  // 1. Base Expected Yield (from Gompertz engine) evaluated at harvest time!
  let predictedYield = batchEstimatedProductionKg({ batch: lot, type, atISO: harvestISO });
  
  // Adjust based on historical Farm Memory Yields
  const lotYields = state.yields.filter(y => y.lotId === lotId);
  let confidence: "Low" | "Medium" | "High" = "Low";
  const risks: string[] = [];

  if (lotYields.length > 0) {
    confidence = lotYields.length > 2 ? "High" : "Medium";
    // Check for alternating bearing (alternance)
    // If last year was huge, this year drops
    const lastYield = lotYields.sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0];
    if (lastYield && lastYield.quantiteKg > predictedYield * 1.2) {
      predictedYield *= 0.8; // Lower prediction due to alternating year
      risks.push("Baisse de rendement attendue (Alternance bi-annuelle)");
    }
  } else {
    risks.push("Manque de données historiques de récolte");
  }

  // 2. Base Expected Cost
  // Récupérer les dépenses de la dernière année
  const oneYearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  
  // Dépenses spécifiques au lot
  const recentLotExpenses = state.depenses.filter(e => e.lotId === lotId && e.dateISO >= oneYearAgoISO);
  const lotSpecificCost = recentLotExpenses.reduce((sum, e) => sum + e.montant, 0);

  // Dépenses globales (sans lotId) réparties proportionnellement au nombre d'arbres
  const recentGlobalExpenses = state.depenses.filter(e => !e.lotId && e.dateISO >= oneYearAgoISO);
  const totalGlobalCost = recentGlobalExpenses.reduce((sum, e) => sum + e.montant, 0);
  const totalTreesInFarm = state.lots.reduce((acc, l) => acc + l.nbArbres, 0);
  const lotShare = totalTreesInFarm > 0 ? lot.nbArbres / totalTreesInFarm : 0;
  const allocatedGlobalCost = totalGlobalCost * lotShare;

  const baseCostLastYear = lotSpecificCost + allocatedGlobalCost;

  let predictedCost = 0;
  if (baseCostLastYear > 0) {
    predictedCost = baseCostLastYear * 1.05; // Ajout d'un buffer/inflation de 5%
  } else {
    // Fallback: estimate 5 DT per tree if no data
    predictedCost = lot.nbArbres * 5;
  }

  // 3. Risks
  if (lot.irrigation === "non_irrigue") {
    risks.push("Sensibilité extrême au stress hydrique");
  }
  const growthStatus = lot.etatCroissance ?? 3;
  if (growthStatus < 3) {
    risks.push("Croissance sous-optimale limitant le potentiel");
  }
  const overdueTasks = state.tasks.filter(t => t.lotId === lotId && t.statut !== "termine" && new Date(t.datePrevueISO) < new Date());
  if (overdueTasks.length > 0) {
    risks.push(`Opérations critiques en retard (${overdueTasks.length})`);
  }

  // 4. Profit
  const predictedRevenue = predictedYield * (state.settings.prixKgOlives || 1);
  const predictedProfit = predictedRevenue - predictedCost;

  if (predictedProfit < 0 && predictedYield > 0) {
    risks.push("Risque de rentabilité négative");
  }

  return {
    yieldKg: Math.round(predictedYield),
    costDt: Math.round(predictedCost),
    profitDt: Math.round(predictedProfit),
    confidence,
    risks
  };
}

export function computeGlobalHealth(state: FarmState): number {
  if (state.lots.length === 0) return 0;
  const scores = state.lots.map(l => computeLotHealth(state, l.id).total);
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

export type MultiYearForecast = {
  year: number;
  yieldKg: number;
  costDt: number;
  revenueDt: number;
  profitDt: number;
};

/**
 * 3. Multi-Year Anticipation Engine
 */
export function computeMultiYearForecast(state: FarmState, yearsToProject: number = 10): MultiYearForecast[] {
  const forecasts: MultiYearForecast[] = [];
  const currentYear = new Date().getFullYear();
  const oneYearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Coût de base total de la ferme sur les 12 derniers mois
  const recentTotalExpenses = state.depenses.filter(e => e.dateISO >= oneYearAgoISO);
  let totalBaseCost = recentTotalExpenses.reduce((sum, e) => sum + e.montant, 0);
  if (totalBaseCost === 0 && state.lots.length > 0) {
    totalBaseCost = state.lots.reduce((acc, l) => acc + (l.nbArbres * 5), 0);
  }

  for (let i = 0; i < yearsToProject; i++) {
    const targetYear = currentYear + i;
    const harvestISO = `${targetYear}-11-01T00:00:00.000Z`; // Période de récolte (Novembre)

    let totalYield = 0;

    for (const lot of state.lots) {
      const type = state.types.find(t => t.id === lot.typeId);
      if (!type) continue;
      totalYield += batchEstimatedProductionKg({ batch: lot, type, atISO: harvestISO });
    }

    // Coût total pour cette année (base + 2% inflation cumulative)
    const inflationFactor = Math.pow(1.02, i);
    const totalCost = totalBaseCost * inflationFactor;

    const revenue = totalYield * (state.settings.prixKgOlives || 1);
    
    forecasts.push({
      year: targetYear,
      yieldKg: Math.round(totalYield),
      costDt: Math.round(totalCost),
      revenueDt: Math.round(revenue),
      profitDt: Math.round(revenue - totalCost),
    });
  }

  return forecasts;
}

