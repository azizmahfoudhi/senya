"use client";

import { useWeather } from "@/lib/useWeather";
import { useMemo } from "react";
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

  const effects = useMemo(() => {
    const defaultEffects = { drops: [] as EffectElement[], clouds: [] as EffectElement[], leaves: [] as EffectElement[], stars: [] as EffectElement[], birds: [] as EffectElement[], isHot: false, showMoon: false };
    if (!weather) return defaultEffects;

    const precip = weather.current.precipitation;
    const wind = weather.current.windSpeed;
    const temp = weather.current.temp;
    const weatherCode = weather.current.weatherCode; // Meteosource specific: 2-6 is clouds
    
    const hour = new Date().getHours();
    const isNight = !weather.current.isDay || hour >= 20 || hour < 5;
    const isDay = weather.current.isDay && hour >= 5 && hour < 20;

    const result = { ...defaultEffects };

    // 1. RAIN
    if (precip > 0) {
      let dropCount = 0;
      if (precip < 2) dropCount = 30;      // Light rain
      else if (precip < 5) dropCount = 80; // Moderate rain
      else dropCount = 150;                // Heavy rain

      result.drops = Array.from({ length: dropCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.6 + Math.random() * 0.4,
      }));
    }

    // 2. WIND (Leaves/Dust)
    if (wind > 20) {
      const leafCount = wind > 40 ? 30 : 10;
      result.leaves = Array.from({ length: leafCount }).map((_, i) => ({
        id: i,
        left: -10, // Start outside screen left
        top: Math.random() * 100, // random height
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 2,
        size: 5 + Math.random() * 10,
      }));
    }

    // 3. CLOUDS
    if (precip === 0 && weatherCode >= 3 && weatherCode <= 8) {
      const cloudCount = weatherCode > 5 ? 6 : 3;
      result.clouds = Array.from({ length: cloudCount }).map((_, i) => ({
        id: i,
        left: -20, // Start outside left
        top: Math.random() * 40, // Top half of screen
        delay: Math.random() * 20,
        duration: 30 + Math.random() * 30, // Slow floating
        size: 100 + Math.random() * 200,
      }));
    }

    // 4. HEAT WAVE / SUN
    if (temp > 35 && isDay && precip === 0 && weatherCode < 4) {
      result.isHot = true;
    }

    // 5. STARS & MOON (Night, clear or partly cloudy)
    if (isNight && precip === 0) {
      const starCount = weatherCode > 6 ? 15 : 40; // fewer stars if cloudy
      result.stars = Array.from({ length: starCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 50, // Top 50%
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 4,
        size: 1 + Math.random() * 2,
      }));
      result.showMoon = weatherCode < 6;
    }

    // 6. BIRDS (Day, clear to partly cloudy, low wind, no rain)
    if (isDay && precip === 0 && wind < 30 && weatherCode < 6) {
      const birdCount = 3 + Math.floor(Math.random() * 4);
      result.birds = Array.from({ length: birdCount }).map((_, i) => ({
        id: i,
        left: 0, 
        top: 10 + Math.random() * 30, // Top 10-40%
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10,
        size: 16 + Math.random() * 8, // SVG size
      }));
    }

    return result;
  }, [weather]);

  if (!weather) return null;

  const { drops, clouds, leaves, stars, birds, isHot, showMoon } = effects;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* HEAT SHIMMER */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-tr from-warning/5 via-danger/5 to-transparent animate-heat mix-blend-overlay" />
      )}

      {/* MOON */}
      {showMoon && (
        <div className="absolute top-[8%] right-[15%] w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 shadow-[0_0_50px_rgba(255,255,255,0.4)] animate-pulse-glow opacity-80" />
      )}

      {/* STARS */}
      {stars.length > 0 && (
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={`star-${star.id}`}
              className="absolute bg-white rounded-full animate-twinkle shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>
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

      {/* BIRDS */}
      {birds.length > 0 && (
        <div className="absolute inset-0 text-foreground/40 dark:text-foreground/20">
          {birds.map((bird) => (
            <svg
              key={`bird-${bird.id}`}
              className="absolute animate-bird"
              style={{
                top: `${bird.top}%`,
                width: `${bird.size}px`,
                height: `${bird.size}px`,
                animationDelay: `${bird.delay}s`,
                animationDuration: `${bird.duration}s`,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 14c4-4 8-4 10 0 2-4 6-4 10 0" />
            </svg>
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
