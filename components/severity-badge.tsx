import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/api";

// DESIGN.md §1: severity color drives visual weight — High/Medium read
// loud, Low/Investigate deliberately quiet (same neutral treatment as the
// muted text color, not a distinct "quiet color").
const SEVERITY_CONFIG: Record<Severity, { label: string; className: string }> = {
  high: { label: "High", className: "border-sev-high/30 bg-sev-high/15 text-sev-high" },
  medium: { label: "Medium", className: "border-sev-medium/30 bg-sev-medium/15 text-sev-medium" },
  low: { label: "Low", className: "border-border bg-transparent text-muted" },
  investigate: { label: "Investigate", className: "border-border bg-transparent text-muted" },
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
