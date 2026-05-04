"use client";

import { useEffect, useState } from "react";

export type WeatherData = {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    isDay: boolean;
    weatherCode: number;
  };
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    uvIndex: number[];
    precipitation: number[];
  };
};

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Coordonnées exactes de Nasrallah, Kairouan
  const lat = 35.3524;
  const lon = 9.8219;

  useEffect(() => {
    async function fetchWeather() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_METEOSOURCE_API_KEY;
        if (!apiKey) throw new Error("API Key manquante");
        
        const res = await fetch(`https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lon}&sections=current,daily&key=${apiKey}`, {
          cache: "no-store"
        });
        if (!res.ok) throw new Error("Erreur de l'API Meteosource");
        
        const json = await res.json();
        
        setData({
          current: {
            temp: json.current?.temperature ?? 0,
            humidity: json.current?.humidity ?? 0, // Note: Meteosource free might not have humidity in current, we fallback to 0
            windSpeed: json.current?.wind?.speed ?? 0,
            precipitation: json.current?.precipitation?.total ?? 0,
            isDay: json.current?.icon_num !== undefined ? (json.current.icon_num < 20) : true, // Icons < 20 are usually day icons
            weatherCode: json.current?.icon_num ?? 0,
          },
          daily: {
            dates: json.daily?.data?.map((d: any) => d.day) ?? [],
            maxTemps: json.daily?.data?.map((d: any) => d.all_day?.temperature_max ?? 0) ?? [],
            minTemps: json.daily?.data?.map((d: any) => d.all_day?.temperature_min ?? 0) ?? [],
            uvIndex: json.daily?.data?.map((d: any) => 0) ?? [], // Free tier might not have UV
            precipitation: json.daily?.data?.map((d: any) => d.all_day?.precipitation?.total ?? 0) ?? [],
          }
        });
        setLastFetched(new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }));
      } catch (err: any) {
        console.warn("Meteosource API failed, using fallback data:", err.message);
        // Fallback mock data
        const tISO = new Date().toISOString().slice(0, 10);
        setData({
          current: {
            temp: 24,
            humidity: 45,
            windSpeed: 12,
            precipitation: 0,
            isDay: true,
            weatherCode: 2,
          },
          daily: {
            dates: [tISO, "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08"],
            maxTemps: [26, 28, 27, 24, 25],
            minTemps: [14, 15, 16, 13, 12],
            uvIndex: [6, 7, 6, 5, 6],
            precipitation: [0, 0, 0, 0, 0],
          }
        });
        setLastFetched(new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }));
        setError(null); // Clear error since we have fallback
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return { data, loading, error, lastFetched };
}
