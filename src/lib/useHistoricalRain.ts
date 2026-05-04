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

  // Calcul du projeté pour la fin de l'année
  const now = new Date();
  const daysPassed = Math.max(1, (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const projectedRainMm = Math.round((ytdRainMm / daysPassed) * 365);

  return { ytdRainMm, projectedRainMm, history, loading };
}
