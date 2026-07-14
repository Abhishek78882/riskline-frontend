"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type EvidencePack } from "@/lib/api";
import { useDataset } from "@/lib/use-dataset";
import { PrimaryMetricViz } from "@/components/evidence/primary-metric-viz";
import { BeforeDuringAfterChart } from "@/components/evidence/before-during-after-chart";
import { DeclineCodeChart } from "@/components/evidence/decline-code-chart";
import { ControlComparisonViz } from "@/components/evidence/control-comparison-viz";
import { SegmentTable } from "@/components/evidence/segment-table";
import { RawEvidenceJson } from "@/components/evidence/raw-evidence-json";

type State =
  | { status: "loading" }
  | { status: "ready"; evidence: EvidencePack }
  | { status: "error"; message: string };

export default function IncidentEvidencePage() {
  const { id } = useParams<{ id: string }>();
  const dataset = useDataset();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    api
      .getEvidence(id, dataset)
      .then((evidence) => {
        if (!cancelled) setState({ status: "ready", evidence });
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

  if (state.status === "loading") {
    return <p className="text-sm text-muted">Loading evidence…</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-muted">Couldn&apos;t load evidence: {state.message}</p>;
  }

  const { evidence } = state;

  return (
    <div className="flex max-w-5xl flex-col gap-12">
      <p className="max-w-2xl text-sm text-muted">
        These are computed aggregates. Jerry explains these facts but does not inspect raw
        transactions.
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Primary metric</h2>
        <PrimaryMetricViz summary={evidence.primary_metric_summary} severity={evidence.severity} />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
          Decline code evidence
        </h2>
        <DeclineCodeChart evidence={evidence.decline_code_evidence} />
      </section>

      {/* Paired side by side — both are fundamentally comparison charts (the
          incident against its own history, and against other segments), and
          together they finally use the width a wide screen actually gives
          this page instead of leaving it empty. Falls back to a single
          stacked column below lg. */}
      <div className="grid grid-cols-1 gap-10 border-t border-border pt-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
            Before / during / after
          </h2>
          <BeforeDuringAfterChart
            bda={evidence.before_during_after}
            metrics={evidence.metrics_involved}
            severity={evidence.severity}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
            Control comparison
          </h2>
          <ControlComparisonViz
            comparison={evidence.control_comparison}
            severity={evidence.severity}
          />
        </section>
      </div>

      <section className="border-t border-border pt-8">
        <SegmentTable rows={evidence.segment_evidence} />
      </section>

      <section>
        <RawEvidenceJson evidence={evidence} />
      </section>
    </div>
  );
}
