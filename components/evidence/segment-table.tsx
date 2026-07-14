"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentEvidenceRow } from "@/lib/api";

function formatSegment(segment: Record<string, unknown>): string {
  return ["country", "mcc", "channel", "auth_type"]
    .map((key) => segment[key])
    .filter(Boolean)
    .join(" · ");
}

function fmt(n: number): string {
  return Math.abs(n) < 10 ? n.toFixed(3) : n.toFixed(1);
}

// Collapsed by default — this is the auditable detail one level down from
// the charts above it, not something every reader needs open.
export function SegmentTable({ rows }: { rows: SegmentEvidenceRow[] }) {
  const [open, setOpen] = useState(false);

  if (rows.length === 0) {
    return <p className="text-sm text-muted">No supporting segment anomalies recorded.</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-ink">
          Top supporting segments ({rows.length})
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2 font-medium">Segment</th>
                <th className="px-4 py-2 font-medium">Metric</th>
                <th className="px-4 py-2 font-medium">Observed</th>
                <th className="px-4 py-2 font-medium">Expected</th>
                <th className="px-4 py-2 font-medium">&Delta;%</th>
                <th className="px-4 py-2 font-medium">Z-score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 text-ink">{formatSegment(row.segment)}</td>
                  <td className="px-4 py-2 text-muted">{row.metric.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 font-mono tabular-nums text-ink">{fmt(row.observed)}</td>
                  <td className="px-4 py-2 font-mono tabular-nums text-muted">{fmt(row.expected)}</td>
                  <td className="px-4 py-2 font-mono tabular-nums text-muted">
                    {row.deviation_pct !== null
                      ? `${row.deviation_pct > 0 ? "+" : ""}${row.deviation_pct.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono tabular-nums text-ink">{row.zscore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
