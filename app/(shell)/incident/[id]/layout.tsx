"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, datasetHref } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { useSelectedIncident } from "@/lib/selected-incident-context";
import { useDataset } from "@/lib/use-dataset";

const SUB_TABS = [
  { segment: "diagnosis", label: "Diagnosis" },
  { segment: "evidence", label: "Evidence" },
  { segment: "ask-jerry", label: "Ask Jerry" },
] as const;

export default function IncidentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const dataset = useDataset();
  const { incident, dataset: contextDataset, setIncident, reset } = useSelectedIncident();
  const [notFound, setNotFound] = useState(false);

  // Overview tile clicks already populate context (incident + dataset)
  // before navigating here. A direct load/refresh arrives with empty
  // context, so re-derive it from the id — built_in and upload share the
  // same incident_id namespace, so both id AND dataset must match or this
  // would show the wrong dataset's incident after switching between them.
  useEffect(() => {
    if (incident?.incident_id === id && contextDataset === dataset) return;
    let cancelled = false;
    api.getIncidents(dataset).then((incidents) => {
      if (cancelled) return;
      const found = incidents.find((i) => i.incident_id === id);
      if (found) setIncident(found, dataset);
      else setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, dataset, incident, contextDataset, setIncident]);

  const showing = incident?.incident_id === id && contextDataset === dataset ? incident : null;

  const handleReset = () => {
    reset();
    router.push(datasetHref("/overview", dataset));
  };

  return (
    <div className="max-w-[1150px] flex flex-col gap-6">
      <Link
        href={datasetHref("/overview", dataset)}
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to Overview
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted">{id}</span>
            {showing && <SeverityBadge severity={showing.severity} />}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {showing?.title ?? (notFound ? "Incident not found" : "Loading incident…")}
          </h1>
        </div>

        {/* Moved here from the (now-hidden-on-this-route) sidebar — see
            components/app-shell.tsx. Same reset() + navigate-to-Overview
            behavior, just relocated so it isn't lost along with the rail. */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="shrink-0 gap-2 text-muted hover:text-ink"
        >
          <RotateCcw className="size-3.5" />
          Reset session
        </Button>
      </div>

      <nav className="flex gap-6 border-b border-border">
        {SUB_TABS.map((tab) => {
          const basePath = `/incident/${id}/${tab.segment}`;
          const active = pathname === basePath;
          return (
            <Link
              key={tab.segment}
              href={datasetHref(basePath, dataset)}
              className={cn(
                "relative -mb-px flex h-9 items-center text-sm transition-colors",
                active ? "text-ink font-medium" : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Keyed by id + dataset: the App Router reuses this same leaf
          component across an id/dataset change (same route shape, different
          param), so without a key, per-incident client state (e.g. the
          Diagnosis page's fetch state) would carry over instead of
          resetting. Remounting is simpler and cheaper than reconciling it
          by hand in every sub-tab. */}
      <Fragment key={`${dataset}:${id}`}>{children}</Fragment>
    </div>
  );
}
