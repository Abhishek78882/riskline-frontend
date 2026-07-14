"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "@/components/severity-badge";
import { useSelectedIncident } from "@/lib/selected-incident-context";
import { datasetHref, type Dataset, type Incident, type Severity } from "@/lib/api";
import { formatWindow } from "@/lib/format";

const LEFT_BORDER: Record<Severity, string> = {
  high: "border-l-sev-high",
  medium: "border-l-sev-medium",
  low: "border-l-border",
  investigate: "border-l-border",
};

const DELTA_TONE: Record<Severity, string> = {
  high: "text-sev-high",
  medium: "text-sev-medium",
  low: "text-muted",
  investigate: "text-muted",
};

function humanize(cause: string): string {
  return cause.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeMetric(metric: string): string {
  return metric.replace(/_/g, " ");
}

export function IncidentCard({ incident, dataset }: { incident: Incident; dataset: Dataset }) {
  const { setIncident } = useSelectedIncident();

  const scopeParts = [
    ...incident.affected_scope.countries,
    ...incident.affected_scope.mccs,
    ...incident.affected_scope.channels,
  ].filter(Boolean);
  const scopeSummary =
    scopeParts.length > 4
      ? `${scopeParts.slice(0, 4).join(", ")} +${scopeParts.length - 4} more`
      : scopeParts.join(", ") || "—";

  const primaryMetric = incident.metrics_involved[0];
  const delta = primaryMetric ? incident.summary_stats.deviation[primaryMetric] : undefined;

  // DESIGN.md §1: "A High-severity outage card should be visually loud;
  // the benign promo (Investigate) should be visually quiet." Medium
  // shares the loud treatment since it's still an active alert, not noise.
  const loud = incident.severity === "high" || incident.severity === "medium";

  return (
    <Link
      href={datasetHref(`/incident/${incident.incident_id}`, dataset)}
      onClick={() => setIncident(incident, dataset)}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border-y border-r border-border border-l-4 bg-card px-5 py-4 transition-transform duration-200 hover:-translate-y-0.5",
        LEFT_BORDER[incident.severity],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{incident.incident_id}</span>
        <SeverityBadge severity={incident.severity} />
      </div>

      <h3
        className={cn(
          "text-base leading-snug",
          loud ? "font-semibold text-ink" : "font-medium text-muted",
        )}
      >
        {incident.title}
      </h3>

      <p className="text-xs text-muted">
        {humanize(incident.candidate_cause_flag)} &middot; {scopeSummary}
      </p>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted">{formatWindow(incident.window)}</span>
        {delta && delta.pct !== null && primaryMetric && (
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-muted">{humanizeMetric(primaryMetric)}</span>
            <span className={cn("font-mono text-sm tabular-nums", DELTA_TONE[incident.severity])}>
              {delta.pct > 0 ? "+" : ""}
              {delta.pct.toFixed(1)}%
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}
