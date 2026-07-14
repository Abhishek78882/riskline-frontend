"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DeclineCodeEvidence } from "@/lib/api";
import { ChartTooltip } from "./chart-tooltip";

// Reuses existing severity/accent tokens as the three family colors rather
// than inventing new hex values — technical (often infra failure) reads as
// the loudest, risk/fraud as amber caution, account/card as the neutral
// accent blue.
const FAMILY_COLOR: Record<string, string> = {
  technical: "var(--sev-high)",
  risk_fraud: "var(--sev-medium)",
  account_card: "var(--accent)",
  other: "var(--text-muted)",
};

const FAMILY_LABEL: Record<string, string> = {
  technical: "Technical",
  risk_fraud: "Risk / fraud",
  account_card: "Account / card",
  other: "Other",
};

export function DeclineCodeChart({ evidence }: { evidence: DeclineCodeEvidence }) {
  if (evidence.total_decline_count === 0) {
    return <p className="text-sm text-muted">No decline codes recorded in this incident window.</p>;
  }

  const data = evidence.top_codes.map((c) => ({
    code: c.code,
    share: Number((c.share * 100).toFixed(2)),
    family: c.family,
  }));

  return (
    <div className="flex flex-col gap-6">
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 8 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="code"
            tick={{ fill: "var(--text)", fontSize: 12, fontFamily: "var(--font-geist-mono)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface)" }} />
          <Bar dataKey="share" radius={4} barSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={FAMILY_COLOR[d.family] ?? FAMILY_COLOR.other} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
              fill="var(--text-muted)"
              fontSize={11}
              fontFamily="var(--font-geist-mono)"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
          {Object.entries(evidence.family_shares).map(([family, share]) => (
            <div
              key={family}
              style={{ width: `${share * 100}%`, backgroundColor: FAMILY_COLOR[family] ?? FAMILY_COLOR.other }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
          {Object.entries(evidence.family_shares).map(([family, share]) => (
            <span key={family} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: FAMILY_COLOR[family] ?? FAMILY_COLOR.other }}
              />
              {FAMILY_LABEL[family] ?? family}
              <span className="font-mono tabular-nums text-ink">{(share * 100).toFixed(1)}%</span>
            </span>
          ))}
        </div>
        {evidence.dominant_family && (
          <p className="mt-2.5 text-xs text-muted">
            Dominant family:{" "}
            <span className="text-ink">
              {FAMILY_LABEL[evidence.dominant_family] ?? evidence.dominant_family}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
