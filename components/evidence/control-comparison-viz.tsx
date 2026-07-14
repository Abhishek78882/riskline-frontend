"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ControlComparison, PeriodStats, Severity } from "@/lib/api";
import { ChartTooltip } from "./chart-tooltip";

const COMPARISON_METRICS = [
  "approval_rate",
  "risk_decline_rate",
  "technical_decline_rate",
  "fraud_rate_bps",
] as const;

// The affected segment reads loud (severity color); controls read calm —
// one neutral, one healthy-green — since in both variants this shape
// covers (3DS failure, card-testing fraud), the controls ARE the healthy
// baseline the affected segment diverges from.
const SEVERITY_FILL: Record<Severity, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
  investigate: "var(--sev-low)",
};
const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  high: "text-sev-high",
  medium: "text-sev-medium",
  low: "text-sev-low",
  investigate: "text-sev-low",
};
const SEVERITY_BG_CLASS: Record<Severity, string> = {
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
  investigate: "bg-sev-low",
};
const CONTROL_COLORS = ["var(--sev-low)", "var(--sev-healthy)"];

function humanizeMetric(metric: string): string {
  return metric.replace(/_/g, " ");
}

// Axis-tick-only shortening — the Tooltip still receives the full
// `name` value via recharts' label, since tickFormatter only touches the
// rendered tick text. Needed because these charts now often sit in a
// half-width column (paired with Before/During/After) and some control
// descriptions ("All other MCCs, ecom non-3DS, same countries") are long
// enough to overlap at that width otherwise.
function shortenTick(description: string, maxLen = 20): string {
  const stripped = description.replace(/\s*\(.*?\)\s*$/, "");
  if (stripped.length <= maxLen) return stripped;
  return `${stripped.slice(0, maxLen - 1).trimEnd()}…`;
}

export function ControlComparisonViz({
  comparison,
  severity,
}: {
  comparison: ControlComparison;
  severity: Severity;
}) {
  if (comparison.type === "none") {
    return <p className="text-sm text-muted">{comparison.interpretation}</p>;
  }

  if (comparison.type === "outage_breadth_control") {
    const pct = comparison.affected_pct_of_all_segments ?? 0;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Segments affected</span>
          <span className={`font-mono text-2xl tabular-nums ${SEVERITY_TEXT_CLASS[severity]}`}>
            {comparison.affected_segment_count}
            <span className="text-base text-muted"> / {comparison.total_segment_count}</span>
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full ${SEVERITY_BG_CLASS[severity]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm leading-relaxed text-muted">{comparison.interpretation}</p>
      </div>
    );
  }

  if (comparison.type === "benign_spike_control") {
    const entries = Object.entries(comparison.during).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    );
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-8">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">{humanizeMetric(key)}</span>
              <span className="font-mono text-lg tabular-nums text-ink">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted">{comparison.interpretation}</p>
      </div>
    );
  }

  // three_ds_failure_control | card_testing_control: affected vs control(s).
  // One small chart per metric (own y-domain each) rather than one chart
  // sharing a single axis — approval_rate (0-1) and fraud_rate_bps (tens to
  // hundreds) are different units entirely, and a shared linear axis made
  // the rate metrics' bars nearly invisible next to fraud_rate_bps's.
  const series = [comparison.affected, ...comparison.controls];
  const metrics = COMPARISON_METRICS.filter((m) =>
    series.every((s) => typeof s.stats[m as keyof PeriodStats] === "number"),
  );

  if (metrics.length === 0) {
    return <p className="text-sm text-muted">{comparison.interpretation}</p>;
  }

  const seriesColor = (i: number) =>
    i === 0 ? SEVERITY_FILL[severity] : CONTROL_COLORS[(i - 1) % CONTROL_COLORS.length];

  return (
    <div className="flex flex-col gap-4">
      {/* Single column, not a 2x2 sub-grid: this component now usually sits
          in a half-width page column already (paired with Before/During/
          After), so each metric gets that column's full width rather than
          being quartered — the earlier 2-column version overlapped its own
          axis labels at that width. */}
      <div className="grid grid-cols-1 gap-8">
        {metrics.map((metric) => {
          const rows = series.map((s) => ({
            name: s.description,
            value: s.stats[metric as keyof PeriodStats] as number,
          }));
          return (
            <div key={metric}>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {humanizeMetric(metric)}
              </span>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value: string) => shortenTick(value)}
                    tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface)" }} />
                  <Bar dataKey="value" radius={4}>
                    {rows.map((_, i) => (
                      <Cell key={i} fill={seriesColor(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
      <p className="text-sm leading-relaxed text-muted">{comparison.interpretation}</p>
    </div>
  );
}
