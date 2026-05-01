import { formatISO, startOfMonth, subMonths } from "date-fns";
import type { FarmState, UUID } from "@/lib/domain";
import {
  batchEstimatedProductionKg,
  buildScenarioState,
  expandRecurringToMonthlyCosts,
  recurringMonthlyTotal,
  sumExpensesTotal,
} from "@/lib/engine";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function farmTotals(state: FarmState, scenarioId?: UUID) {
  const s = buildScenarioState(state, scenarioId);
  const tISO = todayISO();

  const totalTrees = s.lots.reduce((acc, l) => acc + l.nbArbres, 0);
  const totalInvestment = sumExpensesTotal(s);
  const monthlyRecurring = recurringMonthlyTotal(s);

  const typeById = new Map(s.types.map((t) => [t.id, t]));
  const estimatedYearlyProductionKg = s.lots.reduce((acc, lot) => {
    const type = typeById.get(lot.typeId);
    if (!type) return acc;
    return acc + batchEstimatedProductionKg({ batch: lot, type, atISO: tISO });
  }, 0);

  const estimatedRevenue = estimatedYearlyProductionKg * (s.settings.prixKgOlives || 0);

  // Coût annuel approx: récurrent * 12 + dépenses “derniers 12 mois”
  const from12 = formatISO(subMonths(new Date(), 12), { representation: "date" });
  const last12 = s.depenses
    .filter((e) => e.dateISO >= from12 && e.dateISO <= tISO)
    .reduce((acc, e) => acc + e.montant, 0);
  const estimatedYearlyCosts = monthlyRecurring * 12 + last12;

  const profit = estimatedRevenue - estimatedYearlyCosts;
  const costPerKg =
    estimatedYearlyProductionKg > 0 ? estimatedYearlyCosts / estimatedYearlyProductionKg : 0;

  // ROI and Break-Even calculations
  const breakEvenYears = profit > 0 ? totalInvestment / profit : null;
  const roiPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  return {
    totalTrees,
    totalInvestment,
    monthlyRecurring,
    estimatedYearlyProductionKg,
    estimatedRevenue,
    estimatedYearlyCosts,
    profit,
    costPerKg,
    breakEvenYears,
    roiPercentage,
  };
}

export function recurringSeriesLast12Months(state: FarmState) {
  const start = startOfMonth(subMonths(new Date(), 11));
  const fromISO = formatISO(start, { representation: "date" });
  const toISO = formatISO(startOfMonth(new Date()), { representation: "date" });
  return expandRecurringToMonthlyCosts({
    recurrents: state.recurrents,
    fromISO,
    toISO,
  });
}

export type Insight = { level: "info" | "warning" | "danger" | "success"; titre: string; detail: string };

export function buildInsights(state: FarmState): Insight[] {
  const t = farmTotals(state);
  const insights: Insight[] = [];

  if (state.lots.length === 0) {
    insights.push({
      level: "info",
      titre: "Commencez par créer un lot",
      detail:
        "Un lot = arbres plantés au même moment. Ajoutez votre premier lot pour obtenir des estimations de production et de rentabilité.",
    });
    return insights;
  }

  if (t.totalTrees > 0 && t.totalInvestment / t.totalTrees > 200) {
    insights.push({
      level: "warning",
      titre: "Coût par arbre critique",
      detail:
        "Votre investissement dépasse 200 DT par arbre. Surveillez vos dépenses d'infrastructure et d'équipement pour ne pas dégrader le ROI.",
    });
  }

  if (t.estimatedYearlyProductionKg > 0 && t.costPerKg > (state.settings.prixKgOlives || 0)) {
    insights.push({
      level: "danger",
      titre: "Production à perte estimée",
      detail:
        `À ce stade, 1 kg vous coûte ${t.costPerKg.toFixed(2)} DT (Prix de vente: ${state.settings.prixKgOlives} DT). La ferme n'est pas encore rentable, ce qui est normal pour de jeunes plantations.`,
    });
  }

  const irrigationRecurring = state.recurrents
    .filter((r) => r.categorie === "irrigation")
    .reduce((acc, r) => acc + r.montantMensuel, 0);
    
  if (irrigationRecurring > 0 && t.estimatedYearlyProductionKg < 500) {
    insights.push({
      level: "info",
      titre: "Coûts d'irrigation disproportionnés",
      detail:
        "Les coûts d'irrigation pèsent lourd sur une production encore faible. Pensez à ajuster le cycle selon l'âge réel des arbres.",
    });
  }

  if (t.profit > 0 && t.breakEvenYears !== null) {
    if (t.breakEvenYears < 5) {
      insights.push({
        level: "success",
        titre: "Excellente Rentabilité",
        detail: `Si ce rythme se maintient, vous amortirez votre investissement total de ${t.totalInvestment.toLocaleString()} DT en seulement ${t.breakEvenYears.toFixed(1)} ans.`,
      });
    } else {
      insights.push({
        level: "info",
        titre: "Amortissement à long terme",
        detail: `Le retour sur investissement est estimé à ${t.breakEvenYears.toFixed(1)} ans. Augmenter le rendement ou le prix de vente accélérera ce retour.`,
      });
    }
  }

  if (insights.length === 0 && t.profit <= 0) {
    insights.push({
      level: "info",
      titre: "Phase de Croissance",
      detail: "Vos arbres grandissent. Le vrai potentiel économique sera visible lorsque la majorité des lots dépassera 4 à 5 ans d'âge."
    })
  }

  return insights.slice(0, 4);
}

