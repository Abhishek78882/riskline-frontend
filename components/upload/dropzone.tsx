"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        disabled
          ? "cursor-not-allowed border-border opacity-50"
          : "cursor-pointer border-border hover:border-accent/40",
        dragActive && !disabled && "border-accent bg-accent/5",
      )}
    >
      <UploadCloud className="size-6 text-muted" strokeWidth={1.5} />
      <p className="text-sm text-ink">Drop a CSV file here, or click to browse</p>
      <p className="text-xs text-muted">Same hourly aggregate schema as the sample file.</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
