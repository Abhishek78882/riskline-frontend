"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/upload/dropzone";
import { PipelineProgress, PIPELINE_STEPS } from "@/components/upload/pipeline-progress";
import { PipelineDetail } from "@/components/upload/pipeline-detail";
import { api, ApiError } from "@/lib/api";

// Optimistic per-step cadence while the single blocking POST /api/upload
// call is in flight (~50-60s for the real detection pipeline) — the API
// gives no incremental progress, so this is a simulated timeline. It's
// capped one step short of "Ready": that step only completes once the
// real response actually arrives, so this never claims the pipeline
// finished before it did.
const STEP_INTERVAL_MS = 12000;

type Stage =
  | { status: "idle" }
  | { status: "running"; currentStep: number }
  | { status: "error"; message: string };

export default function UploadPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ status: "idle" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runUpload = useCallback(
    async (file: File) => {
      setStage({ status: "running", currentStep: 1 });

      intervalRef.current = setInterval(() => {
        setStage((prev) =>
          prev.status === "running"
            ? { status: "running", currentStep: Math.min(prev.currentStep + 1, PIPELINE_STEPS.length - 2) }
            : prev,
        );
      }, STEP_INTERVAL_MS);

      try {
        await api.postUpload(file);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStage({ status: "running", currentStep: PIPELINE_STEPS.length });
        // Brief pause so the final checkmark is actually seen before navigating.
        await new Promise((resolve) => setTimeout(resolve, 600));
        router.push("/overview?dataset=upload");
      } catch (err) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const message =
          err instanceof ApiError
            ? err.status === 422 || err.status === 400
              ? "That file doesn't match the expected schema. Check the column headers against the sample file and try again."
              : `The pipeline couldn't process this file (HTTP ${err.status}).`
            : "Couldn't reach the API. Confirm it's running at localhost:8000.";
        setStage({ status: "error", message });
      }
    },
    [router],
  );

  const useSample = async () => {
    setStage({ status: "running", currentStep: 0 });
    try {
      const res = await fetch("/demo-upload-sample.csv");
      if (!res.ok) throw new Error("sample fetch failed");
      const blob = await res.blob();
      const file = new File([blob], "demo-upload-sample.csv", { type: "text/csv" });
      runUpload(file);
    } catch {
      setStage({
        status: "error",
        message: "Couldn't load the bundled sample file. Try uploading your own CSV instead.",
      });
    }
  };

  const isRunning = stage.status === "running";

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Upload demo dataset</h1>
        <p className="mt-1 text-sm text-muted">
          Run the real detection pipeline live against a CSV, then explore it the same way as the
          built-in demo.
        </p>
      </div>

      {stage.status === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-sev-high/30 bg-sev-high/10 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-sev-high" />
          <div>
            <p className="text-sm text-ink">{stage.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setStage({ status: "idle" })}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {isRunning ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-6 py-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Running detection pipeline…
          </span>
          <PipelineProgress currentStep={stage.currentStep} />
          <PipelineDetail key={stage.currentStep} currentStep={stage.currentStep} />
        </div>
      ) : (
        stage.status !== "error" && (
          <>
            <button
              type="button"
              onClick={useSample}
              className="group flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent/10 px-6 py-5 text-left transition-colors hover:bg-accent/15"
            >
              <div>
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Sparkles className="size-4 text-accent" />
                  Use sample dataset
                </span>
                <span className="mt-1 block text-xs text-muted">
                  ~36k rows, all 4 injected scenarios, guaranteed to run cleanly.
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Dropzone onFile={runUpload} disabled={isRunning} />

            <p className="text-xs leading-relaxed text-muted">
              Expected columns: <code className="text-ink">timestamp, mcc, country, channel,
              auth_type, txn_count, approval_rate, decline_rate, decline_reason_distribution,
              fraud_count, fraud_rate_bps, avg_ticket_size</code> — the same hourly aggregate
              schema as the bundled sample.
            </p>
          </>
        )
      )}
    </div>
  );
}
