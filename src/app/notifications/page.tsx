"use client";

import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useFarmData } from "@/lib/useFarmData";
import { useWeather } from "@/lib/useWeather";
import { buildInsights } from "@/lib/derive";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Bell, BellOff, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";

export default function NotificationsPage() {
  const farm = useFarmData();
  const { data: weather, loading: weatherLoading } = useWeather();

  const state = {
    settings: farm.settings,
    types: farm.types,
    lots: farm.lots,
    depenses: farm.depenses,
    yields: farm.yields,
    treatments: farm.treatments,
    scenarios: farm.scenarios,
  };

  const insights = buildInsights(state, weather);

  if (farm.loading || weatherLoading) {
    return (
      <AppShell title="Alertes & Notifications">
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Alertes & Notifications">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted">
            {insights.length} alerte{insights.length !== 1 ? "s" : ""} active{insights.length !== 1 ? "s" : ""}
          </span>
        </div>

        {insights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <BellOff className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-sm">Aucune notification</p>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  Votre exploitation ne présente aucune alerte critique ni recommandation d'action.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
            {insights.map((i) => (
              <InsightRow
                key={i.id}
                insight={i}
                onDismiss={() =>
                  farm.actions.setSettings({
                    readInsights: [...(farm.settings.readInsights || []), i.id],
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InsightRow({
  insight,
  onDismiss,
}: {
  insight: ReturnType<typeof buildInsights>[number];
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const borderColor =
    insight.level === "danger"
      ? "border-l-danger"
      : insight.level === "warning"
      ? "border-l-warning"
      : insight.level === "success"
      ? "border-l-success"
      : "border-l-primary";

  const levelBadgeVariant =
    insight.level === "danger"
      ? "danger"
      : insight.level === "warning"
      ? "warning"
      : insight.level === "success"
      ? "success"
      : "primary";

  return (
    <div className={cn("border-l-[3px] px-4 py-3", borderColor)}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{insight.titre}</span>
            <Badge variant={levelBadgeVariant}>
              {insight.level === "danger"
                ? "Critique"
                : insight.level === "warning"
                ? "Attention"
                : insight.level === "success"
                ? "Succès"
                : "Info"}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{insight.whatIsHappening}</p>

          {expanded && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-md border border-border bg-secondary/30 px-3 py-2">
                <p className="font-semibold uppercase tracking-wide text-[10px] text-muted mb-1">
                  🎯 Action recommandée
                </p>
                <p className="font-medium text-foreground">{insight.whatToDo}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-[10px] text-muted mb-0.5">
                  Impact
                </p>
                <p className="text-muted italic">{insight.whyItMatters}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded hover:bg-secondary text-muted transition-colors"
            title={expanded ? "Réduire" : "Voir les détails"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded hover:bg-secondary text-muted transition-colors"
            title="Marquer comme lu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
