"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useWeather } from "@/lib/useWeather";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import { useFarmData } from "@/lib/useFarmData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CloudRain, Droplets, Sun, Wind, Umbrella, MapPin, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { formatNumber } from "@/lib/format";

export default function PluviometriePage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading } = useWeather();
  const { ytdRainMm, projectedRainMm, history, loading: historyLoading } = useHistoricalRain();

  // On utilise la projection de la pluie si elle existe, sinon on se rabat sur le paramètre manuel
  const rainMm = projectedRainMm || farm.settings.pluviometrieAnnuelleMm || 300;
  
  // Calcule de l'impact multiplicateur sur la production basé sur engine.ts
  let bourImpact = 0.6;
  if (rainMm >= 400) bourImpact = 0.8;
  else if (rainMm >= 300) bourImpact = 0.7;

  let faibleImpact = 0.7;
  if (rainMm >= 400) faibleImpact = 0.85;
  else if (rainMm >= 300) faibleImpact = 0.75;

  let normalImpact = 0.9;
  if (rainMm >= 400) normalImpact = 0.95;

  return (
    <AppShell title="Pluviométrie & Météo">
      <div className="mb-6 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <CloudRain className="w-6 h-6 text-primary" />
          Dashboard Pluviométrique
        </h1>
        <p className="text-sm text-muted mt-1">Surveillez les prévisions météorologiques et analysez l'impact de la pluie sur vos rendements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Colonne Principale: Météo */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <CloudRain className="w-48 h-48" />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Météo en direct
                  </CardTitle>
                  <CardDescription>Données pour Nasrallah, Kairouan</CardDescription>
                </div>
                {weather && (
                  <div className="text-3xl font-black">
                    {weather.current.temp}°C
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Skeleton className="h-24" /><Skeleton className="h-24" />
                  <Skeleton className="h-24" /><Skeleton className="h-24" />
                </div>
              ) : weather ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background/50 rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <Wind className="w-6 h-6 text-muted mb-2" />
                      <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Vent</div>
                      <div className="text-xl font-bold">{weather.current.windSpeed} <span className="text-sm font-normal text-muted">km/h</span></div>
                    </div>
                    <div className="bg-background/50 rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <Droplets className="w-6 h-6 text-blue-400 mb-2" />
                      <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Humidité</div>
                      <div className="text-xl font-bold">{weather.current.humidity} <span className="text-sm font-normal text-muted">%</span></div>
                    </div>
                    <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 flex flex-col items-center justify-center text-center">
                      <Umbrella className="w-6 h-6 text-primary mb-2" />
                      <div className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">Précipitations</div>
                      <div className="text-xl font-bold text-primary">{weather.current.precipitation} <span className="text-sm font-normal opacity-80">mm</span></div>
                    </div>
                    <div className="bg-background/50 rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <Sun className="w-6 h-6 text-warning mb-2" />
                      <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Condition</div>
                      <div className="text-sm font-bold mt-1">{weather.current.isDay ? "Journée" : "Nuit"}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted mb-3">Prévisions sur 5 Jours</h3>
                    <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                      {weather.daily.dates.slice(0, 5).map((date, i) => (
                        <div key={date} className="flex-1 min-w-[90px] bg-background/50 border border-border/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-background/80 transition-colors">
                          <div className="text-xs font-semibold text-muted uppercase tracking-wider">
                            {new Date(date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </div>
                          <div className="text-2xl my-1">
                            {weather.daily.maxTemps[i] > 30 ? "☀️" : weather.daily.maxTemps[i] < 15 ? "❄️" : "⛅"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{Math.round(weather.daily.maxTemps[i])}°</span>
                            <span className="text-xs text-muted">{Math.round(weather.daily.minTemps[i])}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-muted/10 rounded-2xl border border-dashed border-border text-muted">
                  Données météorologiques indisponibles. L'API est peut-être hors ligne.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne Secondaire: Impact Pluie */}
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-4 border-b border-primary/10">
              <CardTitle className="text-primary flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5" /> Contribution Oléicole
              </CardTitle>
              <CardDescription>Impact de la pluviométrie estimée sur le rendement final.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 grid gap-5">
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-medium text-foreground/80 mb-1">Pluie Actuelle (Cette année)</div>
                  <div className="text-3xl font-black text-foreground">{historyLoading ? "..." : formatNumber(ytdRainMm)} <span className="text-base font-normal text-muted">mm</span></div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-xs text-muted">Projection Annuelle</div>
                  <div className="text-sm font-bold text-primary">{historyLoading ? "..." : formatNumber(projectedRainMm)} mm/an</div>
                  {projectedRainMm > 0 && Math.abs(projectedRainMm - (farm.settings.pluviometrieAnnuelleMm || 0)) > 10 && (
                    <button 
                      onClick={() => farm.actions.setSettings({ pluviometrieAnnuelleMm: projectedRainMm })}
                      className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-md mt-1 hover:bg-primary/20 transition-colors"
                    >
                      Utiliser pour calculs
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Impact sur le Rendement Max</h4>
                
                <div className="bg-background/60 p-3 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-muted" /> Lots Bour</span>
                    <span className="text-sm font-bold">{formatNumber(bourImpact * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <div className="bg-muted h-1.5 rounded-full" style={{ width: `${bourImpact * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-background/60 p-3 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-300" /> Irrigué (Faible)</span>
                    <span className="text-sm font-bold">{formatNumber(faibleImpact * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-300/30 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${faibleImpact * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-background/60 p-3 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Irrigué (Normal)</span>
                    <span className="text-sm font-bold">{formatNumber(normalImpact * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-500/30 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${normalImpact * 100}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-background/60 p-3 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-success" /> Irrigué (Optimal)</span>
                    <span className="text-sm font-bold">100%</span>
                  </div>
                  <div className="w-full bg-success/30 rounded-full h-1.5">
                    <div className="bg-success h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

              </div>

              <div className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-xl">
                💡 <strong>Note :</strong> Un olivier nécessite environ 400 à 600 mm d'eau par an pour maximiser son potentiel de production. Les déficits sont compensés par l'irrigation, tandis que la pluie naturelle offre un bonus de productivité aux cultures sèches (Bour).
              </div>

            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Historique des Précipitations</CardTitle>
              <CardDescription>Cumul annuel des années précédentes via Open-Meteo.</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h.year} className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl">
                      <span className="font-bold">{h.year}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted/30 rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (h.totalMm / 500) * 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{h.totalMm} mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  );
}
