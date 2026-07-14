import { cn } from "@/lib/utils";
import { SourceBadge } from "@/components/source-badge";
import { GroundingCheck } from "@/components/grounding-check";
import { FormattedText } from "@/components/ask-jerry/formatted-text";
import type { ChatMessage } from "@/lib/chat-context";

// User turns get a real bubble (they're the interactive input); Jerry's
// replies read as plain flowing prose, matching the Diagnosis executive
// summary treatment rather than boxing every answer in a card.
export function ChatMessageView({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-ink">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Jerry</span>
        {message.source && <SourceBadge source={message.source} />}
      </div>
      <FormattedText
        text={message.content}
        className={cn("text-sm leading-relaxed", message.isError ? "italic text-muted" : "text-ink")}
      />
      {message.verifierWarnings && message.verifierWarnings.length > 0 && (
        <GroundingCheck warnings={message.verifierWarnings} />
      )}
    </div>
  );
}
