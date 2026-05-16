"use client";

import { useWeather } from "@/lib/useWeather";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type EffectElement = {
  id: number;
  left: number;
  top?: number;
  delay: number;
  duration: number;
  size?: number;
};

export function WeatherEffects() {
  const { data: weather } = useWeather();
  const [drops, setDrops] = useState<EffectElement[]>([]);
  const [clouds, setClouds] = useState<EffectElement[]>([]);
  const [leaves, setLeaves] = useState<EffectElement[]>([]);
  const [isHot, setIsHot] = useState(false);

  useEffect(() => {
    if (!weather) return;
    
    const precip = weather.current.precipitation;
    const wind = weather.current.windSpeed;
    const temp = weather.current.temp;
    const weatherCode = weather.current.weatherCode; // Meteosource specific: 2-6 is clouds

    // 1. RAIN
    if (precip > 0) {
      let dropCount = 0;
      if (precip < 2) dropCount = 30;      // Light rain
      else if (precip < 5) dropCount = 80; // Moderate rain
      else dropCount = 150;                // Heavy rain

      setDrops(Array.from({ length: dropCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.6 + Math.random() * 0.4,
      })));
    } else {
      setDrops([]);
    }

    // 2. WIND (Leaves/Dust)
    if (wind > 20) {
      const leafCount = wind > 40 ? 30 : 10;
      setLeaves(Array.from({ length: leafCount }).map((_, i) => ({
        id: i,
        left: -10, // Start outside screen left
        top: Math.random() * 100, // random height
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 2,
        size: 5 + Math.random() * 10,
      })));
    } else {
      setLeaves([]);
    }

    // 3. CLOUDS (If not raining, but cloudy condition)
    if (precip === 0 && weatherCode >= 3 && weatherCode <= 8) {
      const cloudCount = weatherCode > 5 ? 6 : 3;
      setClouds(Array.from({ length: cloudCount }).map((_, i) => ({
        id: i,
        left: -20, // Start outside left
        top: Math.random() * 40, // Top half of screen
        delay: Math.random() * 20,
        duration: 30 + Math.random() * 30, // Slow floating
        size: 100 + Math.random() * 200,
      })));
    } else {
      setClouds([]);
    }

    // 4. HEAT WAVE / SUN
    if (temp > 35 && weather.current.isDay && precip === 0 && weatherCode < 4) {
      setIsHot(true);
    } else {
      setIsHot(false);
    }

  }, [weather]);

  if (!weather) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* HEAT SHIMMER */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-tr from-warning/5 via-danger/5 to-transparent animate-heat mix-blend-overlay" />
      )}

      {/* CLOUDS */}
      {clouds.length > 0 && (
        <div className="absolute inset-0 opacity-40 dark:opacity-20 blur-xl">
          {clouds.map((cloud) => (
            <div
              key={`cloud-${cloud.id}`}
              className="absolute bg-white/80 dark:bg-slate-300/50 rounded-full animate-cloud"
              style={{
                top: `${cloud.top}%`,
                width: `${cloud.size}px`,
                height: `${(cloud.size || 100) * 0.4}px`,
                animationDelay: `${cloud.delay}s`,
                animationDuration: `${cloud.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* WIND / LEAVES */}
      {leaves.length > 0 && (
        <div className="absolute inset-0 opacity-60">
          {leaves.map((leaf) => (
            <div
              key={`leaf-${leaf.id}`}
              className="absolute bg-primary/40 dark:bg-primary/20 rounded-tl-full rounded-br-full animate-wind"
              style={{
                top: `${leaf.top}%`,
                width: `${leaf.size}px`,
                height: `${leaf.size}px`,
                animationDelay: `${leaf.delay}s`,
                animationDuration: `${leaf.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* RAIN */}
      {drops.length > 0 && (
        <div className="absolute inset-0 opacity-50 dark:opacity-40">
          {drops.map((drop) => (
            <div
              key={`drop-${drop.id}`}
              className="absolute -top-[10%] w-[1.5px] h-[35px] bg-gradient-to-b from-transparent via-blue-400/40 to-blue-500/80 dark:via-blue-300/40 dark:to-blue-200/80 rounded-full animate-rain"
              style={{
                left: `${drop.left}%`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
