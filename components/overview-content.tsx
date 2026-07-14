"use client";

import { motion } from "motion/react";
import { KpiCard, KpiRow } from "@/components/kpi-card";
import { IncidentCard } from "@/components/incident-card";
import type { Dataset, OverviewResponse } from "@/lib/api";

export function OverviewContent({
  overview,
  dataset,
}: {
  overview: OverviewResponse;
  dataset: Dataset;
}) {
  const { detection_summary: summary, incidents, gemini_configured } = overview;
  const recall = summary.ground_truth_recall;
  // Honest label per PRD §10: real recall for the built-in demo, "n/a"
  // (never a fake 0/0) once ground truth doesn't exist, e.g. an upload.
  // The caption only shows for that n/a case, so it reads as a deliberate
  // honesty label rather than a broken/missing number.
  const recallIsNA = recall.total_gt_non_promo === 0;
  const recallLabel = recallIsNA ? "n/a" : `${recall.detected}/${recall.total_gt_non_promo}`;
  const recallCaption = recallIsNA ? "No ground truth for uploaded data" : undefined;
  const highCount = summary.incidents_by_severity["high"] ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          {dataset === "built_in" ? "Built-in demo dataset" : "Uploaded dataset"}
        </p>
      </div>

      <KpiRow>
        <KpiCard label="Total incidents" value={String(summary.total_incidents)} />
        <KpiCard
          label="High severity"
          value={String(highCount)}
          tone={highCount > 0 ? "sev-high" : "neutral"}
        />
        <KpiCard
          label="Injected anomalies detected"
          value={recallLabel}
          caption={recallCaption}
        />
        <KpiCard
          label="Segment alerts grouped"
          value={`${summary.total_segment_anomalies} → ${summary.total_incidents}`}
          caption="Raw segment alerts grouped into incidents"
        />
        <KpiCard
          label="Gemini status"
          value={gemini_configured ? "Live" : "Fallback"}
          tone={gemini_configured ? "accent" : "neutral"}
        />
      </KpiRow>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Incidents</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {incidents.map((incident, i) => (
            <motion.div
              key={incident.incident_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <IncidentCard incident={incident} dataset={dataset} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
