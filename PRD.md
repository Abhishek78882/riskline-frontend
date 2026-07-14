# PRD — Transaction Anomaly Detection & Diagnostic Assistant (Frontend Rebuild)

**Version:** Frontend v2 (React/Next.js)
**Author/Owner:** Abhishek Shah
**Deadline:** Submit before 16th EOD (build window ~2 days).
**Context:** The Python detection + grounding engine is already built, validated, and deployed as a Streamlit POC. Client feedback (Rahul, decision-maker): the current UI is *pale and text-heavy, not client-ready*; make it *visually premium and understandable by a layman*; *rebuild the frontend from scratch*. This document specs that rebuild.

---

## 0. The one rule above all others

**Do not modify, reimplement, or "improve" the Python detection, evidence, or grounding logic.** The engine in `txn-anomaly-assistant/src/` is the validated core and the entire technical credibility of this project. This rebuild touches only: (a) a thin FastAPI wrapper that exposes the existing functions over HTTP, and (b) a new React/Next.js frontend. If a change seems to require editing detection/evidence/diagnosis math, STOP and flag it — it almost certainly doesn't.

---

## 1. Goals and non-goals

### Goals
1. A visually premium, dark-themed, monitoring-style UI that reads as a real product, not a script.
2. Understandable by a layman: lead with the plain-English diagnosis and one-glance visuals; hide dense tables behind drill-downs.
3. Same functional flow as the current app: landing → overview → per-incident diagnosis → evidence → Ask Jerry.
4. Backed by the existing Python engine, unchanged, via a small API.
5. Deployable to a live link before the deadline.

### Non-goals (explicitly out of scope for this build)
- No changes to detection/evidence/grounding logic.
- No new analytical features, metrics, or incident types.
- No authentication, database, user accounts, or persistence beyond the session.
- No light/dark toggle — dark mode only (see §4).
- No arbitrary raw-file ingestion — upload accepts the same known schema as today.

---

## 2. Architecture (Option A: React + Python API)

```
straive-frontend/          (NEW — Next.js app, this rebuild)
  app/                     App Router pages
  components/              UI components
  lib/                     API client, types
  PRD.md                   this file
  ENGINE_REFERENCE.md      pointer to the engine's data shapes

txn-anomaly-assistant/     (EXISTING — engine, mostly untouched)
  src/                     detection, evidence, llm_diagnosis, prompts, config  (UNCHANGED)
  data/                    precomputed JSON outputs (served as-is)
  api.py                   (NEW — thin FastAPI wrapper, ~100 lines, no engine logic)
```

Two processes in dev: FastAPI on `:8000`, Next.js on `:3000`. The frontend calls the API; the API calls the existing Python functions. The frontend never computes detection/evidence itself.

**Deployment:** Next.js → Vercel. FastAPI → Render (free tier). CORS configured on the API to allow the Vercel domain. (Alternative if simplicity is preferred over robustness: single-repo Vercel with FastAPI as a Python serverless function — riskier due to heavy deps + long detection runtime; only if Render proves troublesome.)

---

## 3. API contract (what the FastAPI wrapper exposes)

The wrapper imports and calls the **existing** functions. No new logic; it only serializes inputs/outputs over HTTP. All responses are the same JSON shapes the engine already produces (see `data/*.json` and `ENGINE_REFERENCE.md`).

| Method | Endpoint | Wraps (existing) | Returns |
|---|---|---|---|
| GET | `/api/overview` | reads `data/incidents.json` + `data/detection_summary.json` | KPI counts, recall, incidents list (built-in demo) |
| GET | `/api/incidents` | reads `data/incidents.json` | array of incidents |
| GET | `/api/incidents/{id}/evidence` | reads `data/evidence_packs.json` | evidence pack for one incident |
| GET | `/api/incidents/{id}/diagnosis` | reads `data/diagnoses.json` | precomputed diagnosis if present |
| POST | `/api/incidents/{id}/diagnose` | `diagnose_incident(id, use_llm=True, evidence_pack_path=...)` | live diagnosis + source + verifier_warnings |
| POST | `/api/incidents/{id}/ask` | `answer_question(id, question, use_llm=True, ...)` | answer + source + verifier_warnings |
| POST | `/api/upload` | `run_detection_pipeline(df, ground_truth=None)` + `build_all_evidence_packs(...)` | pipeline status + counts + incidents (writes to `data/upload_demo/`) |
| GET | `/api/health` | — | `{status: ok}` for warm-up pings |

All endpoints above except `/api/upload` and `/api/health` accept a `?dataset=built_in|upload` query param (default `built_in`) to disambiguate incidents, since both datasets reuse the same IDs (I-001..I-005).

Key rules for the wrapper:
- Read the Gemini key from env (`GEMINI_API_KEY`) exactly as the engine already does; never hardcode.
- Upload endpoint writes only to `data/upload_demo/`, never the committed `data/*.json`.
- Return the engine's `source` ("gemini"/"fallback") and `verifier_warnings` fields untouched — the UI renders them.
- Keep it small. If the wrapper grows past ~150 lines it's doing too much.

---

## 4. Design system (dark, premium, monitoring-grade)

References, in order: **Sentry** (incident structure), **Datadog** (dark monitoring feel, color = status), **Linear** (calm typography and spacing). The look should feel like those, not like a generic admin template.

### 4.1 Theme — dark only
- Background: near-black charcoal, not pure black (e.g. `#0B0E14` base, elevated surfaces `#141922`, cards `#1A2029`). Layer surfaces by elevation so cards lift off the background.
- Text: high-contrast off-white for primary (`#E6EAF0`), muted gray for secondary (`#8A94A6`). Never gray-on-gray with poor contrast.
- One accent color for interactive elements (links, active tab, primary button) — a calm blue/indigo. Accent is NOT the same as severity color.
- Generous whitespace and a clear type scale. Borders are subtle (`#242B36`), not heavy boxes.

### 4.2 Color = status (the most important rule)
Color communicates severity/health, never decoration:
- **High severity / broken:** red (`#F0616D` on dark).
- **Medium:** amber (`#E5A54B`).
- **Low / investigate:** neutral gray/blue — deliberately calm, so it does NOT scream.
- **Healthy / detected-and-resolved context:** green (`#4CC38A`), used sparingly.
Most of the interface stays neutral; color appears only where it means something. A High outage should be visually loud; the benign promo should be visually quiet.

### 4.3 Typography
- One clean sans (Inter or Geist). Large, confident headings; readable body. Tabular numbers for metrics so figures align.

### 4.4 Motion
- Subtle only: fade/slide on load, smooth tab transitions, a real loading state during live Gemini/upload calls. No gratuitous animation.

---

## 5. Screens (in priority order — build top to bottom, stop at any clean point)

> **IA change — 2026-07-14.** Priorities 3-5 below (Diagnosis, Evidence, Ask Jerry) are no
> longer separate top-nav destinations. They are sub-tabs of a new **Incident Detail** page
> at `/incident/[id]`, reached by clicking an incident tile on Overview. Top nav is now just
> the product wordmark + Overview + Architecture. The screen content/priority order described
> below is unchanged — only how a user navigates to Diagnosis/Evidence/Ask Jerry changed (drill
> down from an incident, not a global tab). See DESIGN.md §8 for the full rationale.

### PRIORITY 1 — Landing
Purpose: set the frame and route into the app.
- Product title, subtitle "Issuer-side risk operations", tagline "Code detects anomalies. Jerry explains evidence."
- Two entry cards: **Start with built-in demo** (primary) and **Upload demo dataset** (secondary).
- A horizontal pipeline strip: Load Data → Detect Anomalies → Group Incidents → Build Evidence → Ask Jerry.
- Dark, spacious, premium. This is the first impression that must NOT look like the old app.

### PRIORITY 2 — Overview (global monitoring dashboard)
Purpose: the payoff screen; the whole story in one glance.
- **KPI row** as cards, not plain text: Total incidents, High-severity count, Injected anomalies detected (shows "3/3" for built-in, "n/a" for upload — label it honestly), Segment alerts grouped (e.g. "425 → 5" built-in / "134 → 5" upload), Gemini status (Live/Fallback).
- **Incident list as cards**, not a plain table. Each card: severity color stripe/badge (drives the card's visual weight), incident title, root cause, affected scope summary, time window, and the headline metric delta. High-severity cards read loud; the promo card reads quiet.
- Clicking a card selects that incident and moves to Diagnosis.
- For upload mode, show the pipeline-ran checkmarks (File validated → … → Jerry ready) as proof it ran live.

### PRIORITY 3 — Diagnosis (per incident) — the layman payoff
Purpose: plain-English "what happened and what to do."
- Incident header: id, title, root cause, severity badge, diagnosis source badge (Gemini live / fallback).
- **Executive summary** in large, readable prose — this is the layman view; lead with it.
- Two columns: **Key evidence** (bulleted, each citing a number) and **Recommended actions**.
- **Assumptions** and **Limitations** in a lighter, secondary treatment.
- **Grounding check**: a subtle, collapsible panel. Neutral by default; auto-expands with a count only when warnings exist. Never styled as an error.
- If no precomputed diagnosis (always true after upload): a "Generate diagnosis" button that calls `POST /diagnose` live, with a proper loading state.
- **Sparklines**: for the incident's key metric(s), a small trend line showing the anomaly window so the drop/spike is *seen*, not just read. (Use Recharts or Tremor.)

### PRIORITY 4 — Evidence
Purpose: the auditable detail behind the diagnosis. Progressive disclosure — this is one level down from the diagnosis.
- Header note: "These are computed aggregates. Jerry explains these facts but does not inspect raw transactions."
- Sections rendered as clean cards/tables: Primary metric summary, Before/During/After, Decline code evidence (with a small bar showing family shares), Control comparison, Top supporting segments (collapsible), Raw evidence JSON (collapsible, for auditors).

### PRIORITY 5 — Ask Jerry
Purpose: incident-scoped conversational follow-up.
- Chat UI: Jerry intro message, suggested-question chips (shown only before the first message), message history, input + send.
- Each incident keeps its own chat history; switching incidents does not mix them; a "Clear chat" control.
- Calls `POST /ask`; renders answer, source badge, and grounding-check warnings.
- Loading state ("Jerry is checking the evidence…") during the call.
- A light guard for general app questions (answer locally, don't send to the API) — same behavior as today.

### PRIORITY 6 — Architecture tab
*(Built — 2026-07-14.)* A clean visual of the code-detects / AI-explains flow, at `/architecture`, reachable from the top nav alongside Overview.

---

## 6. Component inventory (for Claude Code)
- `AppShell` (dark theme, top nav = wordmark + Overview + Architecture + a global Reset session control — see IA change note in §5)

> **Sidebar removal — 2026-07-15.** The right-hand "Selected Incident" sidebar described in earlier drafts of this spec was cut. It only ever showed useful content after drilling into an incident, at which point Incident Detail's own header already carries that context — so on Overview it was empty or stale scaffolding. Reset session now lives in the top nav (reachable from anywhere except Incident Detail, which keeps its own copy) instead of the sidebar.
- `IncidentDetailShell` (header: id/title/severity badge + the Diagnosis/Evidence/Ask Jerry sub-tab bar, nested one level below the top nav)
- `KpiCard`, `KpiRow`
- `IncidentCard`, `IncidentList`
- `SeverityBadge`, `SourceBadge`
- `DiagnosisPanel` (summary / key evidence / actions / assumptions / limitations)
- `GroundingCheck` (collapsible, warning-count aware)
- `MetricSparkline`
- `EvidenceSection` variants (primary metric, before/during/after, decline codes, control comparison, segments, raw JSON)
- `ChatPanel` (messages, chips, input), `ChatMessage`
- `PipelineStatus` (upload checkmarks)
- `UploadPanel` (file input, schema note, validate+run button)
- `LoadingState` / spinners

---

## 7. Tech stack
- **Next.js (App Router) + TypeScript.**
- **Tailwind CSS** for styling; **shadcn/ui** for base components (cards, tabs, buttons, dialogs) — gives a premium baseline fast.
- **Recharts** or **Tremor** for sparklines/mini-charts (Tremor is fintech-oriented and quick).
- **lucide-react** for icons.
- A tiny typed API client in `lib/api.ts` with TypeScript interfaces mirroring the engine's JSON shapes (see ENGINE_REFERENCE.md).
- State: React state + context for selected incident and per-incident chat history. No heavy state library needed.

---

## 8. Build phases (mapped to the deadline)

**Phase 0 — API wrapper (do first; unblocks everything).** Add `api.py` (FastAPI) to the existing engine repo, wrapping the functions in §3. Test each endpoint returns real data (`/docs`). No frontend yet. Do NOT touch `src/`.

**Phase 1 — Scaffold + theme.** Next.js app, Tailwind, shadcn/ui, dark theme tokens from §4, AppShell, nav. A blank but premium-looking shell.

**Phase 2 — Landing + Overview.** Wire `/overview`. Incident cards with severity color. This is the "it looks completely different now" moment — get it looking great.

**Phase 3 — Diagnosis.** The layman payoff screen, including sparklines and the grounding check. Wire `/evidence` + `/diagnosis` + live `/diagnose`.

**Phase 4 — Evidence + Ask Jerry.** Progressive-disclosure evidence tables; incident-scoped chat via `/ask`.

**Phase 5 — Upload flow.** Wire `/upload`, pipeline-status checkmarks. (If time is short, upload can stay local-only and be described in the demo.)

**Phase 6 — Deploy.** FastAPI → Render (+CORS), Next.js → Vercel, env vars set. Warm-up test before demo.

**If time runs out:** a polished, live Landing + Overview + Diagnosis (Phases 1-3) already proves the rebuild and demos well. Stop at a clean phase boundary, never mid-screen.

---

## 9. Acceptance criteria
- Dark, premium look that is unmistakably different from the old Streamlit UI.
- Built-in demo loads instantly and shows 5 incidents with correct severity coloring; promo reads visually quiet.
- Diagnosis screen leads with plain-English summary a layman can follow; grounding check present but calm.
- At least one sparkline makes an anomaly visible at a glance.
- Live "Generate diagnosis" and "Ask Jerry" work against the real engine (Gemini live), with graceful fallback.
- Numbers shown always match the active dataset (never hardcoded in the frontend).
- Deployed link works after a warm-up ping.
- Engine `src/` is byte-for-byte unchanged except the new `api.py`.

---

## 10. Things to carry forward from the engine (do not re-derive)
- Incident IDs, severities, root causes, scope, windows: come from `incidents.json`.
- Evidence packs: from `evidence_packs.json`. The frontend renders, never recomputes.
- Diagnoses + verifier warnings + source: from `diagnoses.json` (precomputed) or the live `/diagnose` call.
- Overview counts/recall: from `detection_summary.json`.
- The honest labels: "n/a" recall on upload, "Fallback" when Gemini is off, dual-basis grounding notes — all surfaced, never hidden.
