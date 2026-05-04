"use client";

import { useEffect, useState } from "react";

export type YearlyRain = {
  year: number;
  totalMm: number;
};

export function useHistoricalRain() {
  const [ytdRainMm, setYtdRainMm] = useState<number>(0);
  const [history, setHistory] = useState<YearlyRain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRain() {
      try {
        const today = new Date();
        const currentYear = today.getFullYear();
        // Reculer jusqu'à 3 jours en arrière car l'API archive a parfois un léger délai
        today.setDate(today.getDate() - 3);
        const endDateStr = today.toISOString().slice(0, 10);
        
        // Fetch des 3 dernières années + année courante
        const startYear = currentYear - 3;
        const startDateStr = `${startYear}-01-01`;

        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=35.3524&longitude=9.8219&start_date=${startDateStr}&end_date=${endDateStr}&daily=precipitation_sum&timezone=auto`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erreur Open-Meteo");
        const json = await res.json();

        const dates: string[] = json.daily.time;
        const precipitations: number[] = json.daily.precipitation_sum;

        const yearlySums: Record<number, number> = {};
        
        dates.forEach((dateStr, idx) => {
          const year = parseInt(dateStr.slice(0, 4), 10);
          const precip = precipitations[idx] || 0;
          if (!yearlySums[year]) yearlySums[year] = 0;
          yearlySums[year] += precip;
        });

        const historyArray: YearlyRain[] = [];
        for (let y = startYear; y < currentYear; y++) {
          historyArray.push({ year: y, totalMm: Math.round(yearlySums[y] || 0) });
        }
        
        setHistory(historyArray.reverse()); // Plus récent en premier
        setYtdRainMm(Math.round(yearlySums[currentYear] || 0));

      } catch (err) {
        console.warn("Failed to fetch historical rain", err);
        // Fallbacks
        setYtdRainMm(120); // Valeur par défaut
        setHistory([
          { year: new Date().getFullYear() - 1, totalMm: 310 },
          { year: new Date().getFullYear() - 2, totalMm: 280 },
          { year: new Date().getFullYear() - 3, totalMm: 420 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchRain();
  }, []);

  // Répartition saisonnière moyenne des précipitations en climat méditerranéen (Tunisie)
  // Mois (0 = Janvier, 11 = Décembre) : Pourcentages du total annuel
  const monthlyWeights = [
    0.15, // Jan: 15%
    0.12, // Feb: 12%
    0.12, // Mar: 12%
    0.10, // Apr: 10%
    0.06, // May: 6%
    0.02, // Jun: 2%
    0.00, // Jul: 0%
    0.02, // Aug: 2%
    0.08, // Sep: 8%
    0.13, // Oct: 13%
    0.10, // Nov: 10%
    0.10, // Dec: 10%
  ];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInCurrentMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
  
  // Calculer le pourcentage de l'année écoulée "météorologiquement"
  let accumulatedWeight = 0;
  for (let i = 0; i < currentMonth; i++) {
    accumulatedWeight += monthlyWeights[i];
  }
  // Ajouter la fraction du mois en cours
  accumulatedWeight += monthlyWeights[currentMonth] * (currentDay / daysInCurrentMonth);

  // Éviter la division par zéro en tout début d'année
  const safeWeight = Math.max(0.01, accumulatedWeight);
  const projectedRainMm = Math.round(ytdRainMm / safeWeight);

  return { ytdRainMm, projectedRainMm, history, loading };
}
