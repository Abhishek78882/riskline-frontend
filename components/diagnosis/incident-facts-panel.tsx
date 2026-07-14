import { SeverityBadge } from "@/components/severity-badge";
import { SourceBadge } from "@/components/source-badge";
import { formatWindow } from "@/lib/format";
import type { AffectedScope, Severity, Source, Window } from "@/lib/api";

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scopeSummary(scope: AffectedScope): string {
  const parts = [...scope.countries, ...scope.mccs, ...scope.channels, ...scope.auth_types].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : "—";
}

// The one bordered box in the reading experience — a deliberate exception
// to "cards only when it's the interaction": this is an at-a-glance facts
// reference, clearly distinct from the flowing prose beside it, which is
// exactly what makes the two-column composition read as intentional rather
// than an empty right rail.
export function IncidentFactsPanel({
  incidentId,
  severity,
  source,
  rootCause,
  window,
  affectedScope,
}: {
  incidentId: string;
  severity: Severity;
  source: Source;
  rootCause: string;
  window: Window;
  affectedScope: AffectedScope;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{incidentId}</span>
        <SeverityBadge severity={severity} />
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Root cause</span>
        <p className="mt-1 text-sm text-ink">{humanize(rootCause)}</p>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Diagnosis source
        </span>
        <div className="mt-1.5">
          <SourceBadge source={source} />
        </div>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Window</span>
        <p className="mt-1 text-sm text-ink">{formatWindow(window)}</p>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Affected scope
        </span>
        <p className="mt-1 text-sm leading-relaxed text-ink">{scopeSummary(affectedScope)}</p>
      </div>
    </div>
  );
}
