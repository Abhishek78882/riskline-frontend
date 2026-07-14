import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Stage {
  title: string;
  tag: string;
  icon: LucideIcon;
  description: string;
  // Jerry is the only highlighted stage — the one actual box in this
  // diagram. Every code/data stage stays plain (no card), which is what
  // makes the single boxed, accent-tinted stage read as "this one is
  // different" — surrounded by code on both sides.
  highlight?: boolean;
}

function StageCard({ stage, align }: { stage: Stage; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "max-w-[480px]",
        align === "left" ? "ml-auto" : "mr-auto",
        stage.highlight && "rounded-lg border border-accent/30 bg-accent/5 px-5 py-4",
      )}
    >
      <div className={cn("flex items-center gap-2.5", align === "left" && "flex-row-reverse")}>
        <h3 className="text-base font-semibold text-ink">{stage.title}</h3>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            stage.highlight ? "border-accent/40 text-accent" : "border-border text-muted",
          )}
        >
          {stage.tag}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-muted",
          align === "left" && "text-right",
        )}
      >
        {stage.description}
      </p>
    </div>
  );
}

// A centered spine with stage nodes on it and content alternating left and
// right — uses the full page width instead of a single narrow column, and
// the alternation itself is a calm, premium "how it works" convention
// (Stripe docs, Linear changelog) rather than a busy infographic.
export function PipelineDiagram({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-col">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const onRight = i % 2 === 1;
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.title} className="grid grid-cols-[1fr_auto_1fr] gap-x-6 md:gap-x-10">
            <div className={cn("flex pb-12", onRight && "invisible")}>
              {!onRight && <StageCard stage={stage} align="left" />}
            </div>

            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full border",
                  stage.highlight
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </div>
              {!isLast && (
                <div className="flex flex-1 flex-col items-center">
                  <div className="w-px flex-1 bg-border" />
                  <ChevronDown className="size-4 shrink-0 text-muted" strokeWidth={2} />
                </div>
              )}
            </div>

            <div className={cn("flex pb-12", !onRight && "invisible")}>
              {onRight && <StageCard stage={stage} align="right" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
