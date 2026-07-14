interface ChartTooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayloadEntry[];
}

// Recharts' default tooltip is a light-themed HTML div with no way to
// theme it via the DESIGN.md tokens short of this custom content renderer.
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-muted">
          {entry.color && (
            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          )}
          <span>{entry.name}:</span>
          <span className="font-mono tabular-nums text-ink">
            {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}
