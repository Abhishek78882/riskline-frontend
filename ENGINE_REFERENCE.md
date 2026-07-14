# ENGINE_REFERENCE.md — What the frontend is building against

This is a pointer doc for the frontend rebuild. The Python engine already exists and is validated. **Do not modify it.** The only new Python file is `api.py` (a thin FastAPI wrapper). Read the actual files listed below for exact shapes rather than guessing.

## Where the engine lives
`../txn-anomaly-assistant/` (adjust path to wherever the engine repo sits locally).

## Files to READ for context (do not edit)
- `src/config.py` — segments, base rates, thresholds, anomaly definitions, all paths, `DEFAULT_GEMINI_MODEL`. Source of truth for assumptions.
- `src/detection.py` — has `run_detection_pipeline(df, ground_truth=None)` which returns a dict: `{anomalies, incidents, injected_vs_detected, detection_summary}`. This is the callable the upload endpoint uses.
- `src/evidence.py` — has `build_all_evidence_packs(transactions_path=, incidents_path=, anomalies_path=, ivd_path=)` returning `(packs, warnings)`.
- `src/llm_diagnosis.py` — has `diagnose_incident(incident_id, use_llm=True, evidence_pack_path=None)` and `answer_question(incident_id, question, use_llm=True, evidence_pack_path=None)`. Both return dicts including a `source` field ("gemini"/"fallback") and `verifier_warnings` list.
- `src/prompts.py` — system prompt, taxonomy, response schema. Read-only context.
- `src/analytics_tools.py` — dataframe helpers, `load_transactions(path=None)`, `SEGMENT_COLS`, `invalidate_cache()`.

## Precomputed data the built-in demo serves (READ, serve as-is)
Under `data/`:
- `incidents.json` — array of 5 analyst-facing incidents. Each has: `incident_id`, `candidate_cause_flag`, `title`, `window {start,end}`, `severity`, `status`, `metrics_involved`, `affected_segment_count`, `affected_scope {countries,mccs,channels,auth_types}`, `summary_stats {observed,expected,deviation}`, `top_contributors`, `supporting_anomaly_ids`, `ground_truth_match`.
- `evidence_packs.json` — array; one pack per incident. Each has: `evidence_pack_id`, `incident_id`, `title`, `candidate_cause_flag`, `severity`, `status`, `window`, `affected_scope`, `affected_segment_count`, `metrics_involved`, `primary_metric_summary {metric: {observed, expected, absolute_delta, percent_delta}}`, `before_during_after`, `decline_code_evidence {total_decline_count, top_codes[], family_shares, dominant_family}`, `segment_evidence[]`, `control_comparison {type, interpretation, ...}`, `evidence_notes[]`, `data_limitations[]`, `allowed_root_causes[]`.
- `diagnoses.json` — array of precomputed diagnoses. Each: `incident_id`, `root_cause`, `confidence`, `executive_summary`, `key_evidence[]`, `recommended_actions[]`, `assumptions[]`, `limitations[]`, `source`, `verifier_warnings[]`.
- `detection_summary.json` — `total_segment_anomalies`, `total_incidents`, counts by cause/severity, `top_demo_incidents[]`, `other_minor_signals_count`, `ground_truth_recall {detected, total_gt_non_promo, recall_pct}`.
- `injected_vs_detected.json` — proof table mapping injected scenarios to detected incidents.
- `demo_upload_transactions_quick.csv` — the ~36k-row quick CSV for the live upload demo (27 segments, full 56-day history, all 4 scenarios).

## Incident identity (for the UI)
Five incidents in demo order: I-001 processor outage (High), I-002 card-testing fraud (High), I-003 benign promo (Investigate — the false-positive trap, must read visually quiet), I-004 3DS/ACS failure (High), I-005 minor/unclassified (Low, needs review). Severity drives card color.

## Dataset selector
Every read endpoint and `/diagnose`/`/ask` take a `dataset` query param (`built_in` default, or `upload`) since both datasets reuse the same incident IDs (I-001..I-005). It only switches which `data/*.json` vs `data/upload_demo/*.json` path is read — it does not touch `src/detection.py`'s ID assignment.

## Hard rules for the wrapper
- Env: read `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) from environment exactly as the engine does. Never hardcode a key.
- Upload writes only to `data/upload_demo/` (gitignored). Never overwrite committed `data/*.json`.
- Return `source` and `verifier_warnings` untouched so the UI can render Gemini-vs-fallback and grounding warnings.
- On upload, ground truth is absent, so recall is n/a — pass that through honestly; the UI labels it "n/a". There is also no precomputed `diagnoses.json` equivalent for upload — diagnoses are always generated live via `POST /api/incidents/{id}/diagnose`.
- Enable CORS for the frontend origin (localhost:3000 in dev, the Vercel domain in prod, plus any origin in `FRONTEND_ORIGIN`).
