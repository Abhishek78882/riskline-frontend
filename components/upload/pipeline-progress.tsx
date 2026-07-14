import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PIPELINE_STEPS = [
  "File validated",
  "Detecting anomalies",
  "Grouping incidents",
  "Building evidence",
  "Ready",
];

// currentStep is the index of the step in progress; everything before it
// is done (checkmark), everything after is still pending (empty circle).
// The real POST /api/upload call is a single ~50-60s blocking request with
// no incremental server progress, so this timeline is client-simulated —
// see app/(shell)/upload/page.tsx for the cadence and why it never claims
// "Ready" before the real response actually arrives.
export function PipelineProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col gap-3">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="size-4 shrink-0 text-sev-healthy" />
            ) : active ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
            ) : (
              <Circle className="size-4 shrink-0 text-border" />
            )}
            <span className={cn("text-sm", done || active ? "text-ink" : "text-muted")}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
