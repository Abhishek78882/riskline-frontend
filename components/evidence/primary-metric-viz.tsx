"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { PrimaryMetricStat, Severity } from "@/lib/api";
import { formatMetricValue } from "@/lib/format";

const SEVERITY_FILL: Record<Severity, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
  investigate: "var(--sev-low)",
};

function humanizeMetric(metric: string): string {
  return metric.replace(/_/g, " ");
}

// Plain Expected-vs-Actual, two bars, same scale, no axis to read: Expected
// is always neutral gray (the baseline), Actual is always the severity
// color (the anomaly) — color points at what's wrong, not at every number
// on the page. Replaces an earlier diverging ±100pp bar that needed a
// caption to make sense of.
export function PrimaryMetricViz({
  summary,
  severity,
}: {
  summary: Record<string, PrimaryMetricStat>;
  severity: Severity;
}) {
  const entries = Object.entries(summary).filter(
    ([, s]) => s.observed !== null && s.expected !== null,
  );

  if (entries.length === 0) {
    return <p className="text-sm text-muted">No metric summary available for this incident.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {entries.map(([metric, stat]) => {
        const data = [
          { name: "Expected", value: stat.expected as number, isActual: false },
          { name: "Actual", value: stat.observed as number, isActual: true },
        ];
        const pct = stat.percent_delta;

        return (
          <div key={metric}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {humanizeMetric(metric)}
              </span>
              {pct !== null && (
                <span
                  className="font-mono text-sm font-medium tabular-nums"
                  style={{ color: SEVERITY_FILL[severity] }}
                >
                  {pct > 0 ? "+" : ""}
                  {pct.toFixed(1)}%
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 8 }}>
                <XAxis type="number" hide domain={[0, "auto"]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Bar dataKey="value" radius={4} barSize={16}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.isActual ? SEVERITY_FILL[severity] : "var(--sev-low)"} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: unknown) => formatMetricValue(metric, Number(v))}
                    fill="var(--text)"
                    fontSize={12}
                    fontFamily="var(--font-geist-mono)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
