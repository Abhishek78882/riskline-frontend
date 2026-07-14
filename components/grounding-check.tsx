"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Calm by construction: neutral surface, neutral ShieldCheck icon (not a
// warning triangle), amber (not red) count badge — amber reads "worth a
// look," never "broken." Auto-expands ONLY when warnings exist; collapsed
// and silent otherwise.
export function GroundingCheck({ warnings }: { warnings: string[] }) {
  const hasWarnings = warnings.length > 0;
  const [open, setOpen] = useState(hasWarnings);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <ShieldCheck className="size-4 text-muted" strokeWidth={1.75} />
          Grounding check
          {hasWarnings && (
            <span className="rounded-full bg-sev-medium/15 px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums text-sev-medium">
              {warnings.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Automated checks comparing the answer against the evidence pack. Notes flag claims for
            analyst confirmation — they are not errors.
          </p>
          {hasWarnings ? (
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              No grounding warnings — every numeric claim in this diagnosis matches
              the evidence pack.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
