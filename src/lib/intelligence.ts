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
    stress: number; // /100
  };
};

export type LotForecast = {
  yieldKg: number;
  costDt: number;
  profitDt: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
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
  const type = state.types.find((t) => t.id === lot?.typeId) || state.types[0];
  if (!lot || !type) return fallbackHealth();

  const nowISO = new Date().toISOString();

  // --- 1. Yield Performance (35%) ---
  // Compares estimated yield vs theoretical maximum based on age
  const estimatedYield = batchEstimatedProductionKg({ batch: lot, type, atISO: nowISO, rainMm: state.settings.pluviometrieAnnuelleMm });
  const theoreticalMax = lot.nbArbres * type.rendementMaxKgParArbre;
  let yieldScore = theoreticalMax > 0 ? (estimatedYield / theoreticalMax) * 100 : 0;
  // If lot is very young (age < 3), score shouldn't be 0, it should just be neutral 100 because it's growing perfectly if stars are 3+
  const growth = lot.etatCroissance ?? 3;
  if (estimatedYield === 0 && growth >= 3) {
    yieldScore = 80 + (growth - 3) * 10;
  }
  yieldScore = clamp(yieldScore);

  // --- 2. Water Efficiency (25%) ---
  let waterScore = 50;
  const rain = state.settings.pluviometrieAnnuelleMm ?? 300;

  if (lot.irrigation === "optimal") {
    waterScore = 100;
  } else if (lot.irrigation === "normal") {
    waterScore = 80;
    if (rain >= 400) waterScore += 20;
    else if (rain >= 300) waterScore += 10;
  } else if (lot.irrigation === "faible") {
    waterScore = 50;
    if (rain >= 400) waterScore += 30;
    else if (rain >= 300) waterScore += 20;
    else if (rain >= 200) waterScore += 10;
  } else if (lot.irrigation === "non_irrigue") {
    if (rain >= 400) waterScore = 90;
    else if (rain >= 300) waterScore = 70;
    else waterScore = 40;
  }
  waterScore = clamp(waterScore);

  // --- 3. Financial Efficiency (25%) ---
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



  // --- 4. Environmental Stress (15%) ---
  const lotTreatments = state.treatments.filter(t => t.lotId === lotId);
  let stressScore = 100;
  
  const nowTime = Date.now();
  lotTreatments.forEach(t => {
    const treatTime = new Date(t.dateISO).getTime();
    const daysAgo = (nowTime - treatTime) / (1000 * 60 * 60 * 24);
    
    // On ne pénalise que les traitements récents (maladies actives ou récentes)
    if (daysAgo <= 365) {
      stressScore -= 15; // Grosse pénalité pour maladie dans l'année
    } else if (daysAgo <= 730) {
      stressScore -= 5;  // Légère pénalité résiduelle (1 à 2 ans)
    }
  });

  // Growth state no longer affects stress (stars only affect yield production)

  stressScore = clamp(stressScore);

  // --- Total Calculation ---
  const total = clamp(
    (yieldScore * 0.35) +
    (waterScore * 0.25) +
    (finScore * 0.25) +
    (stressScore * 0.15)
  );

  // Find weakest pillar
  const pillars = {
    Rendement: yieldScore,
    Eau: waterScore,
    Finances: finScore,
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
      stress: stressScore,
    }
  };
}

function fallbackHealth(): HealthScore {
  return {
    total: 0, label: "Inconnu", colorClass: "text-muted", weakestPillar: "N/A",
    breakdown: { yield: 0, water: 0, financial: 0, stress: 0 }
  };
}


/**
 * 2. Prediction Engine (Senya Forecasting Module)
 */
export function computeLotForecast(state: FarmState, lotId: UUID): LotForecast {
  const lot = state.lots.find((l) => l.id === lotId);
  const type = state.types.find((t) => t.id === lot?.typeId) || state.types[0];
  if (!lot || !type) return { yieldKg: 0, costDt: 0, profitDt: 0, confidence: "Faible", risks: [] };

  const now = new Date();
  let targetYear = now.getFullYear();
  // Si on est en Décembre (11), la prochaine récolte est l'année suivante
  if (now.getMonth() >= 11) {
    targetYear += 1;
  }
  const harvestISO = `${targetYear}-11-01T00:00:00.000Z`;
  
  // 1. Base Expected Yield (from Gompertz engine) evaluated at harvest time!
  let predictedYield = batchEstimatedProductionKg({ batch: lot, type, atISO: harvestISO, rainMm: state.settings.pluviometrieAnnuelleMm });
  
  // Adjust based on historical Farm Memory Yields
  const lotYields = state.yields.filter(y => y.lotId === lotId);
  let confidence: "Faible" | "Moyenne" | "Élevée" = "Faible";
  const risks: string[] = [];

  if (lotYields.length > 0) {
    confidence = lotYields.length > 2 ? "Élevée" : "Moyenne";
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
      totalYield += batchEstimatedProductionKg({ batch: lot, type, atISO: harvestISO, rainMm: state.settings.pluviometrieAnnuelleMm });
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

