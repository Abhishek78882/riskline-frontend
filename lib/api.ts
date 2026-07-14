// Typed client for the FastAPI wrapper in ../txn-anomaly-assistant/api.py.
// Mirrors the engine's JSON shapes as documented in ENGINE_REFERENCE.md —
// this file never computes anything, it only calls the API and types the
// response.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Dataset = "built_in" | "upload";
export type Severity = "high" | "medium" | "low" | "investigate";
export type Source = "gemini" | "fallback";

export interface Window {
  start: string;
  end: string;
}

export interface AffectedScope {
  countries: string[];
  mccs: string[];
  channels: string[];
  auth_types: string[];
}

export interface Incident {
  incident_id: string;
  candidate_cause_flag: string;
  title: string;
  window: Window;
  severity: Severity;
  status: string;
  metrics_involved: string[];
  affected_segment_count: number;
  affected_scope: AffectedScope;
  summary_stats: {
    observed: Record<string, number>;
    expected: Record<string, number>;
    deviation: Record<string, { abs: number; pct: number | null }>;
  };
  top_contributors: {
    decline_codes?: Record<string, { count: number; share: number }>;
  };
  supporting_anomaly_ids: string[];
  ground_truth_match: string | null;
}

export interface PrimaryMetricStat {
  observed: number | null;
  expected: number | null;
  absolute_delta: number | null;
  percent_delta: number | null;
}

export interface PeriodStats {
  txn_count?: number;
  approval_rate?: number;
  decline_rate?: number;
  fraud_rate_bps?: number;
  avg_ticket_size?: number;
  technical_decline_rate?: number;
  risk_decline_rate?: number;
  account_decline_rate?: number;
  decline_code_mix?: Record<string, number>;
  window?: Window;
  error?: string;
  insufficient_data?: boolean;
  reason?: string;
}

export interface BeforeDuringAfter {
  duration_hours: number;
  clipped_periods: string[];
  before: PeriodStats;
  during: PeriodStats;
  after: PeriodStats;
}

export interface DeclineCodeEvidence {
  total_decline_count: number;
  top_codes: Array<{ code: string; count: number; share: number; family: string }>;
  family_shares: Record<string, number>;
  dominant_family: string | null;
  family_definitions: Record<string, string[]>;
}

export interface SegmentEvidenceRow {
  segment: Record<string, unknown>;
  metric: string;
  observed: number;
  expected: number;
  deviation_pct: number | null;
  zscore: number;
  window: Window;
  why_included: string;
}

// Mirrors evidence.py's build_control_comparison exactly — it returns one
// of these four shapes depending on candidate_cause_flag, never a superset.
export interface ControlComparisonPair {
  type: "three_ds_failure_control" | "card_testing_control";
  affected: { description: string; stats: PeriodStats };
  controls: Array<{ description: string; stats: PeriodStats }>;
  interpretation: string;
}

export interface ControlComparisonBreadth {
  type: "outage_breadth_control";
  affected_segment_count: number;
  total_segment_count: number;
  affected_pct_of_all_segments: number | null;
  affected_scope: AffectedScope;
  interpretation: string;
}

export interface ControlComparisonSpike {
  type: "benign_spike_control";
  during: PeriodStats;
  interpretation: string;
}

export interface ControlComparisonNone {
  type: "none";
  interpretation: string;
}

export type ControlComparison =
  | ControlComparisonPair
  | ControlComparisonBreadth
  | ControlComparisonSpike
  | ControlComparisonNone;

export interface EvidencePack {
  evidence_pack_id: string;
  incident_id: string;
  title: string;
  candidate_cause_flag: string;
  severity: Severity;
  status: string;
  ground_truth_match: string | null;
  window: Window;
  affected_scope: AffectedScope;
  affected_segment_count: number;
  metrics_involved: string[];
  primary_metric_summary: Record<string, PrimaryMetricStat>;
  before_during_after: BeforeDuringAfter;
  decline_code_evidence: DeclineCodeEvidence;
  segment_evidence: SegmentEvidenceRow[];
  control_comparison: ControlComparison;
  supporting_anomaly_ids: string[];
  allowed_root_causes: string[];
  evidence_notes: string[];
  data_limitations: string[];
  llm_grounding_rules: string[];
}

export interface Diagnosis {
  incident_id: string;
  root_cause: string;
  confidence: string;
  executive_summary: string;
  key_evidence: string[];
  recommended_actions: string[];
  assumptions: string[];
  limitations: string[];
  source: Source;
  fallback_reason?: string;
  verifier_warnings: string[];
}

export interface GroundTruthRecall {
  detected: number;
  total_gt_non_promo: number;
  recall_pct: number;
}

export interface DetectionSummary {
  total_segment_anomalies: number;
  total_incidents: number;
  segment_anomalies_by_cause: Record<string, number>;
  segment_anomalies_by_severity: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  incidents_by_candidate_cause: Record<string, number>;
  top_demo_incidents: Array<Partial<Incident> & { incident_id: string }>;
  other_minor_signals_count: number;
  ground_truth_recall: GroundTruthRecall;
  alert_noise_note: string;
}

export interface OverviewResponse {
  detection_summary: DetectionSummary;
  incidents: Incident[];
  gemini_configured: boolean;
}

export interface AskResponse {
  incident_id: string;
  question: string;
  answer: string;
  source: Source;
  fallback_reason?: string;
  verifier_warnings: string[];
}

export interface UploadResponse {
  status: string;
  pipeline_steps: Array<{ step: string; done: boolean }>;
  counts: { rows: number; segment_anomalies: number; incidents: number };
  incidents: Incident[];
  detection_summary: DetectionSummary;
  evidence_warnings: string[];
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }
  return res.json() as Promise<T>;
}

function withDataset(path: string, dataset?: Dataset): string {
  return dataset ? `${path}?dataset=${dataset}` : path;
}

// For building <Link>/router hrefs that must carry the dataset through
// client-side navigation (Overview tile -> Incident Detail -> its
// sub-tabs). Built-in is the default, so it stays query-string-free; only
// "upload" needs to be explicit.
export function datasetHref(path: string, dataset: Dataset): string {
  return dataset === "upload" ? `${path}?dataset=upload` : path;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  getOverview: (dataset?: Dataset) =>
    request<OverviewResponse>(withDataset("/api/overview", dataset)),

  getIncidents: (dataset?: Dataset) =>
    request<Incident[]>(withDataset("/api/incidents", dataset)),

  getEvidence: (incidentId: string, dataset?: Dataset) =>
    request<EvidencePack>(
      withDataset(`/api/incidents/${incidentId}/evidence`, dataset),
    ),

  // Null, not a thrown error, on 404 — "no precomputed diagnosis yet" is an
  // expected state (always true after upload) that the UI renders as a
  // "Generate diagnosis" prompt, not a failure.
  getDiagnosis: async (
    incidentId: string,
    dataset?: Dataset,
  ): Promise<Diagnosis | null> => {
    try {
      return await request<Diagnosis>(
        withDataset(`/api/incidents/${incidentId}/diagnosis`, dataset),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  postDiagnose: (
    incidentId: string,
    opts?: { useLlm?: boolean; dataset?: Dataset },
  ) =>
    request<Diagnosis>(
      withDataset(`/api/incidents/${incidentId}/diagnose`, opts?.dataset),
      {
        method: "POST",
        body: JSON.stringify({ use_llm: opts?.useLlm ?? true }),
      },
    ),

  postAsk: (
    incidentId: string,
    question: string,
    opts?: { useLlm?: boolean; dataset?: Dataset },
  ) =>
    request<AskResponse>(
      withDataset(`/api/incidents/${incidentId}/ask`, opts?.dataset),
      {
        method: "POST",
        body: JSON.stringify({ question, use_llm: opts?.useLlm ?? true }),
      },
    ),

  postUpload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(res.status, body || res.statusText);
    }
    return res.json() as Promise<UploadResponse>;
  },
};

export { ApiError };
