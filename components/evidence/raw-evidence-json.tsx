"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidencePack } from "@/lib/api";

export function RawEvidenceJson({ evidence }: { evidence: EvidencePack }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-ink">Raw evidence JSON</span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <pre className="max-h-[480px] overflow-auto border-t border-border px-4 py-3 font-mono text-xs leading-relaxed text-muted">
          {JSON.stringify(evidence, null, 2)}
        </pre>
      )}
    </div>
  );
}
