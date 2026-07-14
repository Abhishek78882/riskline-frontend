"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api, type Diagnosis, type EvidencePack } from "@/lib/api";
import { useDataset } from "@/lib/use-dataset";
import {
  getCachedDiagnosis,
  setCachedDiagnosis,
  type DiagnosisCacheEntry,
} from "@/lib/diagnosis-cache";
import { Button } from "@/components/ui/button";
import { PrimaryMetricViz } from "@/components/evidence/primary-metric-viz";
import { IncidentFactsPanel } from "@/components/diagnosis/incident-facts-panel";
import { GroundingCheck } from "@/components/grounding-check";

type DiagnosisState =
  | { status: "loading" }
  | { status: "none" }
  | { status: "generating" }
  | { status: "ready"; diagnosis: Diagnosis }
  | { status: "error"; message: string };

// Both filters are heuristic substring matches against the engine's known
// boilerplate phrasing (data_limitations / the fallback's own meta-
// assumption), not real classification — applied client-side only, since
// the engine can't be touched. Works for the fallback path verbatim; a live
// Gemini response that paraphrases these ideas differently may slip
// through, which just means the section shows a bit more than strictly
// necessary rather than dropping something material.
const GENERIC_LIMITATION_MARKERS = [
  "synthetic",
  "count-based proxy",
  "chargeback-confirmed",
  "not prioritized for demo diagnosis",
  "poc assumption",
];

function pickMaterialLimitation(limitations: string[]): string | null {
  const material = limitations.filter(
    (line) => !GENERIC_LIMITATION_MARKERS.some((marker) => line.toLowerCase().includes(marker)),
  );
  return material[0] ?? null;
}

const META_ASSUMPTION_MARKERS = ["rule-based fallback", "not a language-model interpretation"];

function pickMaterialAssumptions(assumptions: string[]): string[] {
  return assumptions.filter(
    (line) => !META_ASSUMPTION_MARKERS.some((marker) => line.toLowerCase().includes(marker)),
  );
}

export default function IncidentDiagnosisPage() {
  const { id } = useParams<{ id: string }>();
  const dataset = useDataset();

  // Lazy initializer: if this (dataset, id) pair was already resolved this
  // session, render the correct final state immediately — no "loading"
  // flash, no re-fetch, and critically, no window for a precomputed
  // diagnosis to transiently render as "none".
  const [state, setState] = useState<DiagnosisState>(() => {
    const cached = getCachedDiagnosis(dataset, id);
    if (cached) {
      return cached.status === "ready"
        ? { status: "ready", diagnosis: cached.diagnosis }
        : { status: "none" };
    }
    return { status: "loading" };
  });
  const [evidence, setEvidence] = useState<EvidencePack | null>(null);

  // No manual reset-to-"loading" here: the parent layout keys this whole
  // subtree by incident id + dataset (see
  // app/(shell)/incident/[id]/layout.tsx), so switching either remounts
  // this component fresh — useState's initial value already covers it.
  useEffect(() => {
    let cancelled = false;

    api
      .getEvidence(id, dataset)
      .then((pack) => {
        if (!cancelled) setEvidence(pack);
      })
      .catch(() => {
        // Evidence is supplementary here (just the compact metric visual);
        // the diagnosis fetch below is what actually drives page state.
      });

    // Already resolved (precomputed found, or confirmed genuinely absent)
    // — skip the network round-trip entirely rather than re-deriving it.
    if (getCachedDiagnosis(dataset, id)) return;

    api
      .getDiagnosis(id, dataset)
      .then((diagnosis) => {
        if (cancelled) return;
        const entry: DiagnosisCacheEntry = diagnosis ? { status: "ready", diagnosis } : { status: "none" };
        setCachedDiagnosis(dataset, id, entry);
        setState(entry);
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, dataset]);

  const handleGenerate = async () => {
    setState({ status: "generating" });
    try {
      const diagnosis = await api.postDiagnose(id, { dataset });
      setCachedDiagnosis(dataset, id, { status: "ready", diagnosis });
      setState({ status: "ready", diagnosis });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };

  if (state.status === "loading") {
    return <p className="text-sm text-muted">Loading diagnosis…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted">Couldn&apos;t load this diagnosis: {state.message}</p>
        <Button variant="outline" size="sm" onClick={handleGenerate}>
          Try again
        </Button>
      </div>
    );
  }

  if (state.status === "none" || state.status === "generating") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-xl text-sm text-muted">
          No diagnosis has been generated for this incident yet.
        </p>
        <Button onClick={handleGenerate} disabled={state.status === "generating"} className="gap-2">
          {state.status === "generating" && <Loader2 className="size-4 animate-spin" />}
          {state.status === "generating" ? "Generating diagnosis…" : "Generate diagnosis"}
        </Button>
      </div>
    );
  }

  const { diagnosis } = state;
  const materialLimitation = pickMaterialLimitation(diagnosis.limitations);
  const materialAssumptions = pickMaterialAssumptions(diagnosis.assumptions);

  // Compact visual anchor: just the single primary metric (first in
  // metrics_involved), reusing the Evidence tab's Expected-vs-Actual bars
  // rather than a fresh chart — this is one small anchor, not a second
  // Evidence tab, so only one metric renders here even when several are
  // involved.
  const primaryMetricKey = evidence?.metrics_involved[0];
  const primaryMetricSummary =
    evidence && primaryMetricKey && evidence.primary_metric_summary[primaryMetricKey]
      ? { [primaryMetricKey]: evidence.primary_metric_summary[primaryMetricKey] }
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[700px_280px]">
        <div className="flex max-w-[700px] flex-col gap-8">
          {/* DESIGN.md §8: "lead with it" — the layman payoff, large readable prose. */}
          <p className="text-xl leading-relaxed text-ink">{diagnosis.executive_summary}</p>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
              Recommended actions
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-ink">
              {diagnosis.recommended_actions.map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {(materialAssumptions.length > 0 || materialLimitation) && (
            <div className="flex flex-col gap-4">
              {materialAssumptions.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                    Assumptions
                  </h3>
                  <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
                    {materialAssumptions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {materialLimitation && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                    Limitations
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{materialLimitation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          {primaryMetricSummary && evidence && (
            <PrimaryMetricViz summary={primaryMetricSummary} severity={evidence.severity} />
          )}
          {evidence && (
            <IncidentFactsPanel
              incidentId={evidence.incident_id}
              severity={evidence.severity}
              source={diagnosis.source}
              rootCause={diagnosis.root_cause}
              window={evidence.window}
              affectedScope={evidence.affected_scope}
            />
          )}
        </div>
      </div>

      <GroundingCheck warnings={diagnosis.verifier_warnings} />
    </div>
  );
}
