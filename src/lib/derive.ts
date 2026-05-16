import { formatISO, startOfMonth, subMonths } from "date-fns";
import type { FarmState, UUID } from "@/lib/domain";
import type { WeatherData } from "@/lib/useWeather";
import {
  ageYearsFromISO,
  batchEstimatedProductionKg,
  buildScenarioState,
  sumExpensesTotal,
} from "@/lib/engine";
import { computeLotForecast } from "@/lib/intelligence";

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
    return acc + computeLotForecast(s, lot.id).yieldKg;
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



export type Insight = {
  id: string;
  level: "danger" | "warning" | "info" | "success";
  titre: string;
  whatIsHappening: string;
  whatToDo: string;
  whyItMatters: string;
  icon: string;
  priorityScore: number;
};

export function buildInsights(state: FarmState, weather: WeatherData | null = null): Insight[] {
  const t = farmTotals(state);
  const insights: Insight[] = [];
  const tISO = todayISO();
  const today = new Date();

  function addInsight(insight: Omit<Insight, "id">) {
    // Generate a deterministic ID based on title and today's date so it resets daily if dismissed
    const slug = insight.titre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `${slug}-${tISO}`;
    insights.push({ ...insight, id });
  }

  // 1. RISK ALERTS (Weather)
  if (weather) {
    const isRaining = weather.current.precipitation > 0;
    if (weather.current.temp > 35) {
      addInsight({
        level: "danger",
        titre: "Alerte Canicule",
        icon: "🌡️",
        priorityScore: 100,
        whatIsHappening: `Température extrême détectée (${weather.current.temp}°C). Le stress hydrique peut bloquer la croissance des olives.`,
        whatToDo: "Déclenchez une irrigation de nuit ou très tôt le matin pour les lots irrigués.",
        whyItMatters: "L'évaporation est minimale la nuit. Sauver l'humidité garantit la survie des jeunes plants et la taille des fruits."
      });
    } else if (weather.current.temp < 5) {
      addInsight({
        level: "danger",
        titre: "Alerte Gel",
        icon: "❄️",
        priorityScore: 100,
        whatIsHappening: `Risque de gel imminent (${weather.current.temp}°C). Le gel détruit les jeunes pousses végétatives.`,
        whatToDo: "Évitez toute taille immédiate. Allumez des feux de fumée contrôlés si les jeunes plants sont exposés.",
        whyItMatters: "Le tissu végétatif gelé ne produit pas de fleurs, ce qui ampute directement la prochaine récolte."
      });
    } else if (weather.current.windSpeed > 30) {
      addInsight({
        level: "warning",
        titre: "Alerte Vent Fort",
        icon: "🌬️",
        priorityScore: 80,
        whatIsHappening: `Des vents violents sont mesurés à ${weather.current.windSpeed} km/h.`,
        whatToDo: "Repoussez toute application de traitements foliaires ou de pesticides.",
        whyItMatters: "Le vent disperse les produits, annulant leur efficacité et polluant les zones adjacentes (perte d'argent)."
      });
    }

    // Irrigation Guidance
    if (isRaining || weather.current.precipitation > 2) {
      addInsight({
        level: "success",
        titre: "Économie d'eau possible",
        icon: "🌧️",
        priorityScore: 90,
        whatIsHappening: `Les précipitations actuelles (${weather.current.precipitation}mm) assurent une humidité naturelle suffisante.`,
        whatToDo: "Mettez vos systèmes d'irrigation en pause pour les 48 à 72 prochaines heures.",
        whyItMatters: "L'excès d'eau fatigue les racines et représente un coût inutile en énergie et en ressources."
      });
    } else {
      // Forecasted Rain Insight
      const upcomingRainDays = weather.daily.precipitation.slice(0, 3);
      const upcomingRainTotal = upcomingRainDays.reduce((a, b) => a + b, 0);
      
      if (upcomingRainTotal > 3) {
        addInsight({
          level: "info",
          titre: "Pluie prévue sous peu",
          icon: "☔",
          priorityScore: 85,
          whatIsHappening: `Un cumul de ${Math.round(upcomingRainTotal * 10) / 10} mm de pluie est annoncé d'ici 3 jours.`,
          whatToDo: "Suspendez les irrigations prévues et décalez l'application de traitements foliaires.",
          whyItMatters: "Anticiper la pluie vous évite de gaspiller de l'eau par sur-irrigation et d'avoir vos traitements chimiques lessivés (argent perdu)."
        });
      }
    }
  }



  // 3. FINANCIAL WARNINGS
  const thirtyDaysAgo = formatISO(subMonths(today, 1), { representation: "date" });
  const recentExpenses = state.depenses.filter(d => d.dateISO >= thirtyDaysAgo);
  
  if (state.lots.length > 0 && recentExpenses.length === 0) {
    addInsight({
      level: "warning",
      titre: "Mise à jour comptable",
      icon: "🕳️",
      priorityScore: 70,
      whatIsHappening: "Aucune dépense n'a été enregistrée au cours des 30 derniers jours.",
      whatToDo: "Prenez quelques minutes pour saisir vos derniers frais (carburant, main d'œuvre) afin de garder vos scores à jour.",
      whyItMatters: "Une comptabilité précise est indispensable pour calculer votre ROI réel et détecter les gaspillages."
    });
  }

  if (t.costPerKg && state.settings.prixKgOlives && t.costPerKg > (state.settings.prixKgOlives * 0.8)) {
    const isOver = t.costPerKg > state.settings.prixKgOlives;
    addInsight({
      level: "danger",
      titre: isOver ? "Production à perte" : "Marge critique détectée",
      icon: "💸",
      priorityScore: isOver ? 100 : 85,
      whatIsHappening: isOver
        ? `Votre coût de production (${t.costPerKg.toFixed(2)} DT/kg) est supérieur à votre prix de vente (${state.settings.prixKgOlives} DT/kg).`
        : `Votre coût de production (${t.costPerKg.toFixed(2)} DT/kg) se rapproche dangereusement de votre prix de vente (${state.settings.prixKgOlives} DT/kg).`,
      whatToDo: isOver
        ? "Réduisez drastiquement vos coûts opérationnels ou transformez vos olives (huile) pour capter plus de valeur."
        : "Analysez le graphique des dépenses. Réduisez les coûts de main d'œuvre ou cherchez à vendre vos olives plus cher (circuit direct).",
      whyItMatters: isOver
        ? "Chaque kilo produit actuellement creuse votre déficit financier. Votre modèle économique n'est plus viable à ce stade."
        : "Une marge nette inférieure à 20% met votre exploitation en risque financier au moindre aléa climatique."
    });
  }

  // 4. PERFORMANCE INSIGHTS (Lots underperforming)
  const underperformingLots = state.lots.filter(l => (l.etatCroissance ?? 3) <= 2);
  if (underperformingLots.length > 0) {
    addInsight({
      level: "warning",
      titre: "Parcelles sous-performantes",
      icon: "📉",
      priorityScore: 75,
      whatIsHappening: `${underperformingLots.length} lot(s) (ex: ${underperformingLots[0].nom}) signalent une production estimée très faible par rapport à leur potentiel.`,
      whatToDo: "Inspectez le système d'irrigation de ces lots et prévoyez un apport en azote/potasse ciblé.",
      whyItMatters: "Ces lots font chuter la production globale. Un traitement correctif rapide peut réactiver la pousse avant le printemps."
    });
  }

  // 5. SEASONAL GUIDANCE
  const currentMonth = today.getMonth() + 1; // 1-12
  if (currentMonth === 1 || currentMonth === 2) {
    addInsight({
      level: "info",
      titre: "Saison de la Taille",
      icon: "✂️",
      priorityScore: 50,
      whatIsHappening: "L'arbre est en repos végétatif hivernal.",
      whatToDo: "Procédez à la taille de fructification et aérez le centre de l'arbre. Appliquez un fongicide au cuivre après la coupe.",
      whyItMatters: "Une bonne pénétration de la lumière garantit une floraison homogène et prévient l'humidité (œil de paon)."
    });
  } else if (currentMonth === 4 || currentMonth === 5) {
    addInsight({
      level: "info",
      titre: "Période de Floraison",
      icon: "🌸",
      priorityScore: 60,
      whatIsHappening: "Les inflorescences se développent. L'arbre consomme énormément d'énergie.",
      whatToDo: "Maintenez une humidité du sol constante. Apportez du bore (traitement foliaire) pour favoriser la nouaison.",
      whyItMatters: "Tout stress hydrique ou carence durant cette phase fait chuter les fleurs, détruisant la récolte avant même qu'elle ne commence."
    });
  } else if (currentMonth === 9 || currentMonth === 10) {
    addInsight({
      level: "info",
      titre: "Préparation Récolte",
      icon: "🧺",
      priorityScore: 50,
      whatIsHappening: "La lipogenèse (création de l'huile) est en phase finale.",
      whatToDo: "Stoppez l'irrigation 2 à 3 semaines avant la récolte. Nettoyez le sol sous les arbres et réservez vos ouvriers.",
      whyItMatters: "Couper l'eau augmente le pourcentage d'huile (moins d'eau dans le fruit) et facilite mécaniquement la récolte."
    });
  }

  // 6. GENERAL (Empty state / Positive)
  if (state.lots.length === 0) {
    addInsight({
      level: "info",
      titre: "Initialisation requise",
      icon: "👋",
      priorityScore: 10,
      whatIsHappening: "Votre compte ne contient aucune donnée sur vos parcelles.",
      whatToDo: "Allez dans l'onglet 'Lots' et ajoutez vos plantations (âge, nombre d'arbres, type).",
      whyItMatters: "Sans la structure de votre ferme, le moteur d'Intelligence Artificielle ne peut pas générer de recommandations sur-mesure."
    });
  } else if (t.profit > 0 && t.breakEvenYears && t.breakEvenYears < 5 && insights.length < 2) {
    addInsight({
      level: "success",
      titre: "Performance Exceptionnelle",
      icon: "🏆",
      priorityScore: 5,
      whatIsHappening: `Votre ferme est hautement rentable avec un amortissement estimé à ${t.breakEvenYears.toFixed(1)} ans.`,
      whatToDo: "Envisagez de réinvestir le surplus dans la modernisation (irrigation intelligente) ou dans de nouveaux plants.",
      whyItMatters: "Optimiser le capital dégagé permet de sécuriser l'exploitation face à une éventuelle mauvaise année (alternance)."
    });
  }

  // Sort by Priority Score descending, filter out read ones, then take top 5
  return insights
    .filter(i => !(state.settings.readInsights || []).includes(i.id))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);
}

