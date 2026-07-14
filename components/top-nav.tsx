"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSelectedIncident } from "@/lib/selected-incident-context";

// Diagnosis/Evidence/Ask Jerry are no longer global tabs — they're sub-tabs
// of Incident Detail (/incident/[id]), reached by drilling into an incident
// from Overview. See DESIGN.md §8 "Navigation architecture" note.
const TABS = [
  { href: "/overview", label: "Overview" },
  { href: "/architecture", label: "Architecture" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { incident, reset } = useSelectedIncident();
  // /upload is a pre-app step (reached from Landing before "entering" the
  // app proper), not a destination within it — it gets the wordmark only,
  // no Overview/Architecture tabs, matching Landing's own chrome-free feel.
  const isPreApp = pathname === "/upload";
  // Incident-detail pages already have their own Reset in the incident
  // header (see incident/[id]/layout.tsx) — showing it here too would be a
  // second, redundant "Reset session" button on the same screen.
  const showGlobalReset = !isPreApp && !pathname?.startsWith("/incident/");

  const handleReset = () => {
    reset();
    router.push("/overview");
  };

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-surface px-6">
      {/* Nav wordmark stays Geist, not the display serif — DESIGN.md §2
          restricts DM Serif Display to the hero and section/page headings,
          never small persistent chrome like this. Always routes home,
          from anywhere in the app. */}
      <Link
        href="/"
        className="mr-10 text-[15px] font-semibold tracking-tight text-ink"
      >
        Riskline
      </Link>

      {!isPreApp && (
        <nav className="flex h-full items-center gap-8">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex h-full items-center text-sm transition-colors"
              >
                <span
                  className={cn(
                    "transition-colors",
                    active ? "text-ink font-medium" : "text-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Global fallback now that the sidebar (which used to hold this) is
          gone — incident-detail pages still have their own copy in the
          incident header; this is what keeps it reachable everywhere else,
          e.g. from Overview. */}
      {showGlobalReset && (
        <div className="ml-auto">
          {incident ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-muted hover:text-ink"
            >
              <RotateCcw className="size-3.5" />
              Reset session
            </Button>
          ) : (
            // Inert, not `disabled`: shadcn's disabled state stacks
            // opacity-50 on top of already-muted text, dropping below
            // DESIGN.md's "never gray-on-gray with weak contrast" floor.
            // Nothing to reset yet, so it's kept legible but
            // non-interactive instead.
            <Button
              variant="outline"
              size="sm"
              aria-disabled="true"
              tabIndex={-1}
              className="pointer-events-none gap-2 text-muted"
            >
              <RotateCcw className="size-3.5" />
              Reset session
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
