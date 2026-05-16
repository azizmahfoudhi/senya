"use client";

import * as React from "react";
import { useWeather } from "@/lib/useWeather";

type Theme = "day" | "night" | "sunrise" | "sunset" | "rain" | "hot";

const ThemeContext = React.createContext<{
  theme: Theme;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("day");
  const [mounted, setMounted] = React.useState(false);
  const { data: weather } = useWeather();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !weather) return;

    let nextTheme: Theme = "day";
    const hour = new Date().getHours();
    
    // Determine time-based theme
    if (!weather.current.isDay) {
        nextTheme = "night";
    } else if (hour >= 5 && hour < 8) {
        nextTheme = "sunrise";
    } else if (hour >= 17 && hour < 20) {
        nextTheme = "sunset";
    }

    // Weather overrides time (if extreme)
    if (weather.current.precipitation > 0) {
        nextTheme = "rain";
    } else if (weather.current.temp > 35 && weather.current.isDay) {
        nextTheme = "hot";
    }

    setTheme(nextTheme);
  }, [weather, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("day", "night", "sunrise", "sunset", "rain", "hot", "light", "dark");
    if (theme !== "day") {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
