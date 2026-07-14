import { cn } from "@/lib/utils";

const TONE_CLASS = {
  neutral: "text-ink",
  accent: "text-accent",
  "sev-high": "text-sev-high",
} as const;

export function KpiCard({
  label,
  value,
  tone = "neutral",
  caption,
}: {
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASS;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {/* Geist Mono + tabular-nums per DESIGN.md §2/§6 — the number
          dominates the label, not the other way round. */}
      <span className={cn("font-mono text-3xl font-semibold tabular-nums", TONE_CLASS[tone])}>
        {value}
      </span>
      {/* Makes an intentional "n/a" (no ground truth on uploads) read as a
          designed honesty label, not a broken/missing number. */}
      {caption && <span className="text-xs text-muted">{caption}</span>}
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </div>
  );
}
