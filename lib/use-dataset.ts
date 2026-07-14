"use client";

import { useSearchParams } from "next/navigation";
import type { Dataset } from "@/lib/api";

// Single source of truth for "which dataset is this page looking at" on
// every incident-detail route — reads the ?dataset= query param set when
// the Overview tile was clicked (or preserved through the redirect/sub-tab
// links). Anything other than exactly "upload" is treated as built_in.
export function useDataset(): Dataset {
  const searchParams = useSearchParams();
  return searchParams.get("dataset") === "upload" ? "upload" : "built_in";
}
