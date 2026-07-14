import { cn } from "@/lib/utils";
import type { Source } from "@/lib/api";

// Green here is a deliberate, narrow reuse of --sev-healthy for "the live
// path is working as intended" rather than incident severity — requested
// explicitly for this one badge, not a general status-color pattern.
export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  const isLive = source === "gemini";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        isLive
          ? "border-sev-healthy/30 bg-sev-healthy/15 text-sev-healthy"
          : "border-border bg-surface text-muted",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", isLive ? "bg-sev-healthy" : "bg-muted")} />
      {isLive ? "Gemini live" : "Fallback"}
    </span>
  );
}
