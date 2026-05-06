"use client";

import { useEffect, useState } from "react";

export type WeatherData = {
  current: {
    temp: number;
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
      const CACHE_KEY = "senya_weather_cache";
      const COOLDOWN = 5 * 60 * 1000; // 5 minutes
      
      try {
        // 1. Check local cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < COOLDOWN) {
            setData(cachedData);
            setLastFetched(new Date(timestamp).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }));
            setLoading(false);
            return; // Skip fetch
          }
        }

        // 2. Fetch if no cache or expired
        const apiKey = process.env.NEXT_PUBLIC_METEOSOURCE_API_KEY;
        if (!apiKey) throw new Error("API Key manquante");
        
        const res = await fetch(`https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lon}&sections=current,daily&key=${apiKey}`, {
          cache: "no-store"
        });
        if (!res.ok) throw new Error("Erreur de l'API Meteosource");
        
        const json = await res.json();
        const weatherObj: WeatherData = {
          current: {
            temp: json.current?.temperature ?? 0,
            windSpeed: json.current?.wind?.speed ?? 0,
            precipitation: json.current?.precipitation?.total ?? 0,
            isDay: json.current?.icon_num !== undefined ? (json.current.icon_num < 20) : true,
            weatherCode: json.current?.icon_num ?? 0,
          },
          daily: {
            dates: json.daily?.data?.map((d: any) => d.day) ?? [],
            maxTemps: json.daily?.data?.map((d: any) => d.all_day?.temperature_max ?? 0) ?? [],
            minTemps: json.daily?.data?.map((d: any) => d.all_day?.temperature_min ?? 0) ?? [],
            uvIndex: json.daily?.data?.map((d: any) => 0) ?? [],
            precipitation: json.daily?.data?.map((d: any) => d.all_day?.precipitation?.total ?? 0) ?? [],
          }
        };

        const now = Date.now();
        setData(weatherObj);
        setLastFetched(new Date(now).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }));
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: weatherObj, timestamp: now }));
        
      } catch (err: any) {
        console.warn("Meteosource API failed, using fallback:", err.message);
        // Fallback mock data (no cache storage for mock)
        const tISO = new Date().toISOString().slice(0, 10);
        const fallback: WeatherData = {
          current: { temp: 24, windSpeed: 12, precipitation: 0, isDay: true, weatherCode: 2 },
          daily: {
            dates: [tISO, "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08"],
            maxTemps: [26, 28, 27, 24, 25],
            minTemps: [14, 15, 16, 13, 12],
            uvIndex: [6, 7, 6, 5, 6],
            precipitation: [0, 0, 0, 0, 0],
          }
        };
        setData(fallback);
        setLastFetched(new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }));
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return { data, loading, error, lastFetched };
}
