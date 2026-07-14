"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Dataset, Incident } from "@/lib/api";

interface SelectedIncidentValue {
  incident: Incident | null;
  // Which dataset `incident` was fetched from — built_in and upload share
  // the same incident_id namespace (I-001..I-005), so the id alone can't
  // tell two incidents apart. Callers must compare both.
  dataset: Dataset | null;
  setIncident: (incident: Incident, dataset: Dataset) => void;
  reset: () => void;
}

const SelectedIncidentContext = createContext<SelectedIncidentValue | null>(null);

// Lives at the AppShell level so it survives navigation between Overview
// and Incident Detail (both render under the same (shell) layout). Overview
// tiles set it on click; Incident Detail re-derives it from the id on a
// direct load/refresh, since context alone wouldn't survive that.
export function SelectedIncidentProvider({ children }: { children: React.ReactNode }) {
  const [incident, setIncidentState] = useState<Incident | null>(null);
  const [dataset, setDatasetState] = useState<Dataset | null>(null);

  const setIncident = useCallback((next: Incident, nextDataset: Dataset) => {
    setIncidentState(next);
    setDatasetState(nextDataset);
  }, []);
  const reset = useCallback(() => {
    setIncidentState(null);
    setDatasetState(null);
  }, []);

  return (
    <SelectedIncidentContext.Provider value={{ incident, dataset, setIncident, reset }}>
      {children}
    </SelectedIncidentContext.Provider>
  );
}

export function useSelectedIncident() {
  const ctx = useContext(SelectedIncidentContext);
  if (!ctx) {
    throw new Error("useSelectedIncident must be used within SelectedIncidentProvider");
  }
  return ctx;
}
