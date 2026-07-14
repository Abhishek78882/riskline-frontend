import { api, type Dataset, type OverviewResponse } from "@/lib/api";
import { OverviewContent } from "@/components/overview-content";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ dataset?: string }>;
}) {
  const { dataset: datasetParam } = await searchParams;
  const dataset: Dataset = datasetParam === "upload" ? "upload" : "built_in";

  let overview: OverviewResponse | null = null;
  try {
    overview = await api.getOverview(dataset);
  } catch {
    overview = null;
  }

  if (!overview) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {dataset === "upload" ? "No uploaded dataset yet" : "Overview unavailable"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {dataset === "upload"
            ? "The upload flow lands in Phase 5 — start with the built-in demo instead."
            : "Couldn't reach the API. Confirm it's running at localhost:8000."}
        </p>
      </div>
    );
  }

  return <OverviewContent overview={overview} dataset={dataset} />;
}
