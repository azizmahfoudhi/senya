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
  };
};

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coordonnées exactes de Nasrallah, Kairouan
  const lat = 35.3524;
  const lon = 9.8219;

  useEffect(() => {
    async function fetchWeather() {
      try {
        const apiKey = "a2b47a2988da4ab3956222827260305";
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5&aqi=no&alerts=no`);
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const json = await res.json();
        
        setData({
          current: {
            temp: json.current.temp_c,
            humidity: json.current.humidity,
            windSpeed: json.current.wind_kph,
            precipitation: json.current.precip_mm,
            isDay: json.current.is_day === 1,
            weatherCode: json.current.condition.code,
          },
          daily: {
            dates: json.forecast.forecastday.map((d: any) => d.date),
            maxTemps: json.forecast.forecastday.map((d: any) => d.day.maxtemp_c),
            minTemps: json.forecast.forecastday.map((d: any) => d.day.mintemp_c),
            uvIndex: json.forecast.forecastday.map((d: any) => d.day.uv),
          }
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return { data, loading, error };
}
