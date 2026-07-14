import type { Dataset, Diagnosis } from "@/lib/api";

// Module-level (not React state/context) because exactly one consumer
// reads/writes it — the Diagnosis page. Keyed by (dataset, id) since
// built_in and upload share the same incident_id namespace.
//
// This exists to fix a real bug: switching tabs/incidents repeatedly could
// make a precomputed diagnosis (I-001-I-004) transiently re-derive to
// "none" and flash the "Generate diagnosis" button — which, if clicked,
// fires a real, costly, unnecessary live Gemini call. Once a (dataset, id)
// pair resolves once (precomputed found, genuinely absent, or freshly
// generated live), that answer is cached and never re-fetched or
// re-derived from scratch for the rest of the session — so a transient
// re-render/re-mount can no longer misclassify it.
export type DiagnosisCacheEntry = { status: "ready"; diagnosis: Diagnosis } | { status: "none" };

const cache = new Map<string, DiagnosisCacheEntry>();

function cacheKey(dataset: Dataset, id: string): string {
  return `${dataset}:${id}`;
}

export function getCachedDiagnosis(dataset: Dataset, id: string): DiagnosisCacheEntry | undefined {
  return cache.get(cacheKey(dataset, id));
}

export function setCachedDiagnosis(dataset: Dataset, id: string, entry: DiagnosisCacheEntry): void {
  cache.set(cacheKey(dataset, id), entry);
}
