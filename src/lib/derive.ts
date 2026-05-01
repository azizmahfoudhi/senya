import { formatISO, startOfMonth, subMonths } from "date-fns";
import type { FarmState, UUID } from "@/lib/domain";
import {
  ageYearsFromISO,
  batchEstimatedProductionKg,
  buildScenarioState,
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

  const typeById = new Map(s.types.map((t) => [t.id, t]));
  const estimatedYearlyProductionKg = s.lots.reduce((acc, lot) => {
    const type = typeById.get(lot.typeId);
    if (!type) return acc;
    return acc + batchEstimatedProductionKg({ batch: lot, type, atISO: tISO });
  }, 0);

  const estimatedRevenue = estimatedYearlyProductionKg * (s.settings.prixKgOlives || 0);

  // Coût annuel approx: dépenses “derniers 12 mois”
  const from12 = formatISO(subMonths(new Date(), 12), { representation: "date" });
  const last12 = s.depenses
    .filter((e) => e.dateISO >= from12 && e.dateISO <= tISO)
    .reduce((acc, e) => acc + e.montant, 0);
  const estimatedYearlyCosts = last12;

  const profit = estimatedRevenue - estimatedYearlyCosts;
  const costPerKg =
    estimatedYearlyProductionKg > 0 ? estimatedYearlyCosts / estimatedYearlyProductionKg : 0;

  // ROI and Break-Even calculations
  const breakEvenYears = profit > 0 ? totalInvestment / profit : null;
  const roiPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  return {
    totalTrees,
    totalInvestment,
    estimatedYearlyProductionKg,
    estimatedRevenue,
    estimatedYearlyCosts,
    profit,
    costPerKg,
    breakEvenYears,
    roiPercentage,
  };
}

export function expensesSeriesLast12Months(state: FarmState) {
  const series = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    const monthPrefix = formatISO(d, { representation: "date" }).slice(0, 7); // yyyy-MM
    
    const montant = state.depenses
      .filter((e) => e.dateISO.startsWith(monthPrefix))
      .reduce((acc, e) => acc + e.montant, 0);

    series.push({
      monthISO: `${monthPrefix}-01`,
      montant,
    });
  }
  return series;
}

export type WeatherData = {
  temp: number;
  precipitation: number;
  isRaining: boolean;
};

export type Insight = {
  level: "info" | "warning" | "danger" | "success";
  titre: string;
  detail: string;
  icon?: string;
};

export function buildInsights(state: FarmState, weather: WeatherData | null = null): Insight[] {
  const t = farmTotals(state);
  const insights: Insight[] = [];

  // 1. Data Freshness
  const today = new Date();
  const thirtyDaysAgo = formatISO(subMonths(today, 1), { representation: "date" });
  const recentExpenses = state.depenses.filter(d => d.dateISO >= thirtyDaysAgo);
  
  if (state.lots.length > 0 && recentExpenses.length === 0) {
    insights.push({
      level: "info",
      titre: "Comptabilité à jour ?",
      detail: "Je remarque que vous n'avez enregistré aucune dépense ce mois-ci. N'oubliez pas de saisir vos factures pour que mes projections restent précises.",
      icon: "📅"
    });
  }

  // 2. Weather & Irrigation Advice
  if (weather) {
    if (weather.isRaining || weather.precipitation > 2) {
      insights.push({
        level: "success",
        titre: "Pluie en cours / prévue",
        detail: `La météo annonce de la pluie (${weather.precipitation}mm). Inutile d'irriguer aujourd'hui, vous pouvez suspendre vos cycles pour économiser l'eau et l'énergie.`,
        icon: "🌧️"
      });
    } else if (weather.temp > 32) {
      insights.push({
        level: "danger",
        titre: "Alerte Canicule",
        detail: `Il fait très chaud actuellement (${weather.temp}°C). Augmentez la fréquence d'irrigation, de préférence tard le soir ou tôt le matin pour limiter l'évaporation.`,
        icon: "🌡️"
      });
    } else if (weather.temp > 25 && weather.precipitation === 0) {
      insights.push({
        level: "warning",
        titre: "Temps sec et chaud",
        detail: `Il fait ${weather.temp}°C sans précipitation prévue. C'est une fenêtre idéale pour un cycle d'irrigation standard.`,
        icon: "☀️"
      });
    }
  }



  // 4. Age-Based Yield Milestones
  if (state.lots.length > 0) {
    const tISO = todayISO();
    const lotsApproachingMaturity = state.lots.filter(l => {
      const age = ageYearsFromISO(l.datePlantationISO, tISO);
      return age >= 3.5 && age <= 4.5;
    });

    if (lotsApproachingMaturity.length > 0) {
      const names = lotsApproachingMaturity.map(l => l.nom).join(", ");
      insights.push({
        level: "success",
        titre: "Pic de production en vue !",
        detail: `Excellente nouvelle ! Vos lots (${names}) approchent de leur pleine maturité. Vous devriez voir un saut significatif dans la récolte la saison prochaine. Préparez la main d'œuvre !`,
        icon: "📈"
      });
    }
  }

  // 5. Profitability & General Business
  if (t.profit > 0 && t.breakEvenYears !== null) {
    if (t.breakEvenYears < 5) {
      insights.push({
        level: "success",
        titre: "Félicitations, ferme très saine",
        detail: `Votre gestion est excellente. Au rythme actuel, vous amortirez la totalité de votre investissement initial dans ${t.breakEvenYears.toFixed(1)} ans. Continuez ainsi !`,
        icon: "💰"
      });
    }
  } else if (t.profit <= 0 && state.lots.length > 0) {
    insights.push({
      level: "info",
      titre: "Phase de Croissance",
      detail: "Vos projections affichent un déficit, mais c'est normal pour une jeune ferme. Vos rendements augmenteront naturellement avec l'âge de vos oliviers.",
      icon: "🌱"
    });
  }

  if (state.lots.length === 0) {
    insights.push({
      level: "info",
      titre: "Je suis là pour vous aider",
      detail: "Bonjour ! Je suis votre assistant agricole. Commencez par créer un lot dans la section 'Paramétrer la ferme' pour que je puisse commencer à analyser vos données.",
      icon: "👋"
    });
  }

  // 6. Seasonal Calendar (Tunisia/Kairouan)
  const currentMonth = today.getMonth() + 1; // 1-12
  if (currentMonth === 1 || currentMonth === 2) {
    insights.push({
      level: "info",
      titre: "Calendrier: Taille & Engrais",
      detail: "C'est la période idéale pour la taille de fructification et l'apport d'engrais organique avant le réveil végétatif du printemps.",
      icon: "✂️"
    });
  } else if (currentMonth === 4 || currentMonth === 5) {
    insights.push({
      level: "warning",
      titre: "Calendrier: Floraison critique",
      detail: "Période de floraison. Assurez-vous d'éviter tout stress hydrique pour maximiser la formation des fruits.",
      icon: "🌸"
    });
  } else if (currentMonth >= 10 && currentMonth <= 12) {
    insights.push({
      level: "success",
      titre: "Calendrier: Préparation Récolte",
      detail: "La saison de récolte approche ! Pensez à vérifier votre matériel et à budgétiser la main-d'œuvre.",
      icon: "🧺"
    });
  }

  // 7. Preventative Action (Pest Control)
  if (currentMonth >= 4 && currentMonth <= 6) {
    const hasPestControl = state.depenses.some(d => d.categorie === "entretien" && d.dateISO >= thirtyDaysAgo);
    if (!hasPestControl && state.lots.length > 0) {
      insights.push({
        level: "warning",
        titre: "Traitements Préventifs",
        detail: "Pensez aux traitements contre la teigne ou la mouche de l'olivier. Aucune dépense de traitement n'a été notée récemment.",
        icon: "🐛"
      });
    }
  }

  // 8. Nasrallah Context (Bour vs Irrigué)
  const hasBour = state.lots.some(l => l.irrigation === "non_irrigue");
  if (hasBour && currentMonth >= 6 && currentMonth <= 8) {
    insights.push({
      level: "warning",
      titre: "Terres en Bour (Nasrallah)",
      detail: "Pour vos lots non irrigués, pensez au travail du sol superficiel pour casser la croûte et conserver l'humidité résiduelle face aux chaleurs de Kairouan.",
      icon: "🏜️"
    });
  }

  // 9. Variety Intelligence
  const typeById = new Map(state.types.map(t => [t.id, t]));
  const hasChemlali = state.lots.some(l => {
    const type = typeById.get(l.typeId);
    return type && type.nom.toLowerCase().includes("chemlali");
  });
  if (hasChemlali) {
    insights.push({
      level: "info",
      titre: "Spécificité Chemlali",
      detail: "Vos lots de Chemlali sont sujets à l'alternance. Une taille douce et régulière aidera à stabiliser la production d'une année sur l'autre.",
      icon: "🌳"
    });
  }

  const hasKoroneiki = state.lots.some(l => {
    const type = typeById.get(l.typeId);
    return type && type.nom.toLowerCase().includes("koroneiki");
  });
  if (hasKoroneiki) {
    insights.push({
      level: "info",
      titre: "Conduite Intensive",
      detail: "Le Koroneiki nécessite des apports d'eau et de nutriments très réguliers pour maintenir son rendement élevé.",
      icon: "💧"
    });
  }

  return insights.slice(0, 5);
}

