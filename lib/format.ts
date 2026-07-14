// Shared by every screen that renders PrimaryMetricViz (Evidence's full
// metric list, Diagnosis's single-metric visual anchor) so the same number
// reads the same way everywhere. Rate metrics (approval_rate,
// technical_decline_rate, etc.) display as a percentage — far more readable
// than a raw 0-1 fraction; everything else (counts, bps, ticket size) gets
// a plain 2-3 significant-figure rounding instead of the engine's full
// 6-decimal precision.
export function formatMetricValue(metric: string, value: number): string {
  if (metric.endsWith("_rate")) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return formatPlainNumber(value);
}

export function formatPlainNumber(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  if (abs >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

export function formatWindow(window: { start: string; end: string }): string {
  const start = new Date(window.start);
  const end = new Date(window.end);
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(start);
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}
