"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useWeather } from "@/lib/useWeather";
import { useHistoricalRain } from "@/lib/useHistoricalRain";
import { useFarmData } from "@/lib/useFarmData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  CloudRain,
  Droplets,
  Sun,
  Wind,
  Umbrella,
  Activity,
  Cloud,
  Snowflake,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function PluviometriePage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading } = useWeather();
  const { ytdRainMm, projectedRainMm, history, loading: historyLoading } = useHistoricalRain();

  const rainMm = projectedRainMm || farm.settings.pluviometrieAnnuelleMm || 300;

  let bourImpact = 0.6;
  if (rainMm >= 400) bourImpact = 0.8;
  else if (rainMm >= 300) bourImpact = 0.7;

  let faibleImpact = 0.7;
  if (rainMm >= 400) faibleImpact = 0.85;
  else if (rainMm >= 300) faibleImpact = 0.75;

  let normalImpact = 0.9;
  if (rainMm >= 400) normalImpact = 0.95;

  return (
    <AppShell title="Météo & Pluviométrie">
      <div className="space-y-4">
        {/* Weather stats */}
        {weatherLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : weather ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="Température"
              value={`${weather.current.temp}°C`}
              sub={weather.current.isDay ? "Journée" : "Nuit"}
              icon={<Sun className="w-4 h-4" />}
            />
            <Stat
              label="Vent"
              value={`${weather.current.windSpeed} km/h`}
              icon={<Wind className="w-4 h-4" />}
            />
            <Stat
              label="Précipitations"
              value={`${weather.daily.precipitation[0] ?? 0} mm`}
              sub="Aujourd'hui"
              icon={<Umbrella className="w-4 h-4" />}
            />
            <Stat
              label="Pluie YTD"
              value={historyLoading ? "..." : `${formatNumber(ytdRainMm)} mm`}
              sub={`Projection: ${formatNumber(projectedRainMm)} mm/an`}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 5-day forecast */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prévisions 5 Jours</CardTitle>
                <span className="text-xs text-muted">Nasrallah, Kairouan</span>
              </div>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <Skeleton className="h-32" />
              ) : weather ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jour</TableHead>
                      <TableHead>Conditions</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Pluie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weather.daily.dates.slice(0, 5).map((date, i) => (
                      <TableRow key={date}>
                        <TableCell className="font-medium">
                          {new Date(date).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {weather.daily.precipitation[i] > 2 ? (
                              <CloudRain className="w-4 h-4 text-primary" />
                            ) : weather.daily.maxTemps[i] > 30 ? (
                              <Sun className="w-4 h-4 text-warning" />
                            ) : weather.daily.maxTemps[i] < 10 ? (
                              <Snowflake className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Cloud className="w-4 h-4 text-muted" />
                            )}
                            <span className="text-sm text-muted">
                              {weather.daily.precipitation[i] > 2
                                ? "Pluie"
                                : weather.daily.maxTemps[i] > 30
                                ? "Ensoleillé"
                                : weather.daily.maxTemps[i] < 10
                                ? "Froid"
                                : "Nuageux"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Math.round(weather.daily.maxTemps[i])}°
                        </TableCell>
                        <TableCell className="text-right text-muted">
                          {Math.round(weather.daily.minTemps[i])}°
                        </TableCell>
                        <TableCell className="text-right">
                          {weather.daily.precipitation[i] > 0 ? (
                            <span className="text-primary font-medium">
                              {weather.daily.precipitation[i]} mm
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted py-6 text-center">
                  Données météo indisponibles
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rain impact panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle>Impact Pluviométrique</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted">Projection annuelle</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      {historyLoading ? "..." : `${formatNumber(projectedRainMm)} mm`}
                    </span>
                    {projectedRainMm > 0 &&
                      Math.abs(projectedRainMm - (farm.settings.pluviometrieAnnuelleMm || 0)) > 10 && (
                        <button
                          onClick={() =>
                            farm.actions.setSettings({ pluviometrieAnnuelleMm: projectedRainMm })
                          }
                          className="text-[10px] uppercase font-bold tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                        >
                          Appliquer
                        </button>
                      )}
                  </div>
                </div>

                {[
                  { label: "Bour (Non irrigué)", val: bourImpact, color: "bg-muted" },
                  { label: "Irrigué (Faible)", val: faibleImpact, color: "bg-blue-400" },
                  { label: "Irrigué (Normal)", val: normalImpact, color: "bg-blue-500" },
                  { label: "Irrigué (Optimal)", val: 1.0, color: "bg-success" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-muted">
                        <Droplets className="w-3 h-3" />
                        {row.label}
                      </span>
                      <span className="font-semibold">{Math.round(row.val * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color}`}
                        style={{ width: `${row.val * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                <p className="text-[10px] text-muted mt-2 leading-relaxed">
                  Un olivier nécessite ~400–600 mm/an pour maximiser la production. Le déficit hydrique est compensé par l'irrigation.
                </p>
              </CardContent>
            </Card>

            {/* Historical rain */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des Précipitations</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div
                        key={h.year}
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/40 transition-colors"
                      >
                        <span className="font-semibold text-sm w-10 shrink-0">{h.year}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (h.totalMm / 500) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted font-medium w-14 text-right shrink-0">
                          {h.totalMm} mm
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
