"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BeforeDuringAfter, PeriodStats, Severity } from "@/lib/api";
import { ChartTooltip } from "./chart-tooltip";

const KEY_METRICS = [
  "approval_rate",
  "technical_decline_rate",
  "risk_decline_rate",
  "fraud_rate_bps",
  "txn_count",
] as const;

const SEVERITY_FILL: Record<Severity, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
  investigate: "var(--sev-low)",
};

function humanizeMetric(metric: string): string {
  return metric.replace(/_/g, " ");
}

const PERIODS = ["before", "during", "after"] as const;

export function BeforeDuringAfterChart({
  bda,
  metrics,
  severity,
}: {
  bda: BeforeDuringAfter;
  metrics: string[];
  severity: Severity;
}) {
  const relevant = KEY_METRICS.filter((m) => metrics.includes(m));
  if (relevant.length === 0) {
    return <p className="text-sm text-muted">No key metrics available for this comparison.</p>;
  }

  return (
    // Capped at 2 columns (not 3) since this now often sits in a half-width
    // column next to Control Comparison — 3 columns needs more room than a
    // paired-section layout leaves it.
    <div className="grid gap-8 sm:grid-cols-2">
      {relevant.map((metric) => {
        const rows = PERIODS.map((period) => {
          const stats: PeriodStats = bda[period];
          const raw = stats?.[metric as keyof PeriodStats];
          const value = typeof raw === "number" ? raw : null;
          return {
            period: period[0].toUpperCase() + period.slice(1),
            value,
            isDuring: period === "during",
            insufficient: Boolean(stats?.error || stats?.insufficient_data),
          };
        });
        const hasData = rows.some((r) => r.value !== null);

        return (
          <div key={metric}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              {humanizeMetric(metric)}
            </span>
            {hasData ? (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface)" }} />
                  <Bar dataKey="value" radius={4}>
                    {rows.map((r, i) => (
                      <Cell key={i} fill={r.isDuring ? SEVERITY_FILL[severity] : "var(--sev-low)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-2 text-xs text-muted">Insufficient data for this period.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
