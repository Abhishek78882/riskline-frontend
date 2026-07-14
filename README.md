# Riskline

A frontend for **txn-anomaly-assistant** — a diagnostic-assistant proof of concept for a
card issuer's risk & operations team. This repo is **only the UI**: Next.js screens that call
a thin API in front of an existing, unchanged Python detection engine.

**This is a demo POC, not a production fraud system.** All data is synthetic, there is no
auth/database/incident-lifecycle tracking, and detection is batch-oriented rather than
real-time. It exists to make the engine's output legible and demoable, not to replace a real
risk-ops platform.

## Core principle

**Code detects. The LLM only explains.**

1. A statistical detector (same-hour-of-week baseline + MAD-based z-score, with volume/magnitude/persistence
   gates) finds anomalies and groups them into incidents. This is deterministic Python, not an LLM.
2. Code assembles a compact, numeric **evidence pack** per incident — aggregates only, never raw transactions.
3. **Jerry** (Gemini) reads only that evidence pack and writes a plain-language diagnosis. Jerry never sees
   a raw transaction and never performs detection — it only explains what code already found.
4. A **grounding verifier** (code, not an LLM) checks every number Jerry states against the evidence pack
   afterward and flags anything unsupported. This is a visible safety feature by design, not an error state.

See the in-app **Architecture** screen (`/architecture`) for the full pipeline diagram, and
`../txn-anomaly-assistant/ENGINE_REFERENCE.md` for the exact data shapes.

## Architecture

```
Next.js frontend (this repo)  <-->  api.py (thin FastAPI wrapper)  <-->  existing Python engine (src/)
      :3000                              :8000
```

- The engine (`txn-anomaly-assistant/src/`) is unchanged. The only new file added to that repo is
  `api.py`, a thin wrapper (~225 lines) that calls the engine's existing functions and serializes
  their output over HTTP — it contains no detection, evidence, or diagnosis logic of its own.
- This frontend never computes a metric, a diagnosis, or a severity — it only renders what the API returns.
- Two datasets share the same incident-ID namespace (`I-001`..`I-005`): the committed **built-in** demo
  and a live **upload** run. A `?dataset=built_in|upload` query param (threaded through routes via a
  `useDataset()` hook) disambiguates them everywhere.

## Tech stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v4** with a dark-only design-token system (see `DESIGN.md`)
- **shadcn/ui** (base-nova style) for primitives — Button, Tabs, Badge, Tooltip, Separator
- **Recharts** for sparklines and evidence charts
- **Motion** (formerly Framer Motion) for subtle page-load reveals, respecting `prefers-reduced-motion`
- **lucide-react** for icons
- **Gemini** (via the engine's `src/llm_diagnosis.py`) powers Jerry's diagnosis and Q&A, with a
  deterministic rule-based fallback whenever no API key is configured or a live call fails

## Run locally

Two servers: the engine's API on `:8000`, this frontend on `:3000`.

**1. Engine API** (from `../txn-anomaly-assistant`):

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add `GEMINI_API_KEY` to `.env` for live Gemini calls (optional — without it, Jerry runs entirely
in its deterministic fallback mode). Then:

```
uvicorn api:app --reload --port 8000
```

**2. Frontend** (from this repo):

```
npm install
npm run dev
```

Optionally set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the API isn't at the default
`http://localhost:8000`.

| Variable | Where | Required | Default | Purpose |
|---|---|---|---|---|
| `GEMINI_API_KEY` | engine (`.env`) | No | (unset) | Enables live Gemini calls for diagnosis/Q&A; falls back to rule-based output without it |
| `GEMINI_MODEL` | engine (`.env`) | No | `gemini-2.5-flash` | Overrides the Gemini model |
| `NEXT_PUBLIC_API_BASE_URL` | frontend (`.env.local`) | No | `http://localhost:8000` | Where the frontend looks for the API |
| `FRONTEND_ORIGIN` | engine (env) | No | (unset) | Extra CORS origin to allow (e.g. the deployed Vercel domain) |

Never commit `.env`/`.env.local` — both are gitignored in their respective repos.

## API contract

All endpoints below except `/api/upload` and `/api/health` accept an optional
`?dataset=built_in|upload` query param (default `built_in`).

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/health` | `{status: "ok"}` — warm-up ping |
| GET | `/api/overview` | Detection summary, incidents list, and whether Gemini is configured |
| GET | `/api/incidents` | Array of incidents for the selected dataset |
| GET | `/api/incidents/{id}/evidence` | The evidence pack for one incident |
| GET | `/api/incidents/{id}/diagnosis` | The precomputed diagnosis, or 404 if none exists yet (always true right after an upload) |
| POST | `/api/incidents/{id}/diagnose` | Generates a diagnosis live (Gemini or fallback), grounded only in that incident's evidence pack |
| POST | `/api/incidents/{id}/ask` | Answers a free-text question about one incident, scoped to its evidence pack only |
| POST | `/api/upload` | Accepts a CSV in the engine's hourly-aggregate schema, runs detection + evidence live, and returns pipeline status + the resulting incidents |

## Screens

- **Landing** (`/`) — product framing, tagline ("Code detects anomalies. Jerry explains evidence."),
  and two entry points: built-in demo or upload demo dataset.
- **Upload** (`/upload`) — pre-app step for the upload path: file picker, schema note, and a live
  pipeline-progress view (validate → detect → group → build evidence → Jerry ready).
- **Overview** (`/overview`) — the monitoring dashboard: a KPI row (incident counts, high-severity
  count, injected-anomaly recall, Gemini status) and an incident card grid. Uses the full page width —
  there's no secondary sidebar. Clicking a card drills into Incident Detail.
- **Incident Detail** (`/incident/[id]`) — a compact header (id, title, severity badge) above three
  sub-tabs:
  - **Diagnosis** — the layman payoff: executive summary in large prose, key evidence, recommended
    actions, a metric sparkline, and the collapsible grounding check.
  - **Evidence** — the auditable detail behind the diagnosis: primary metric summary, before/during/after,
    decline-code breakdown, control-group comparison, supporting segments, raw evidence JSON.
  - **Ask Jerry** — incident-scoped chat, with its own history per incident and suggested-question chips.
- **Architecture** (`/architecture`) — a visual walkthrough of the code-detects / Jerry-explains /
  grounding-verifies pipeline.

Reset session is reachable from the top nav everywhere (Incident Detail keeps its own copy in its
header instead of duplicating the global one).

## Honest notes

- **Built-in demo recall ("3/3")** means the detector found all 3 non-promo injected ground-truth
  scenarios in this one synthetic dataset. It is a sanity check on this demo's data, **not** a
  production precision/recall benchmark.
- **Uploaded datasets have no ground truth**, so recall shows **"n/a"** rather than a fabricated number.
- **Grounding-check warnings are a safety feature working as intended**, not a bug: they mean the
  verifier caught a number in Jerry's answer that it couldn't confirm against the evidence pack, and
  is surfacing that for an analyst to check — never silently hidden or silently "corrected."
