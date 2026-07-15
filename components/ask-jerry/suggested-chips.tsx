const CHIPS = [
  "What caused this?",
  "What should we do first?",
  "How confident are we in this?",
  "Which segments were hit hardest?",
];

export function SuggestedChips({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onSelect(chip)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-ink"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
