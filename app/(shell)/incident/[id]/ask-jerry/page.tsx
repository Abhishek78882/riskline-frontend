"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useDataset } from "@/lib/use-dataset";
import { useChat } from "@/lib/chat-context";
import { ChatMessageView } from "@/components/ask-jerry/chat-message";
import { SuggestedChips } from "@/components/ask-jerry/suggested-chips";

// Simple keyword heuristic, not real intent detection — deliberately kept
// small ("optional, keep simple"). Anything that doesn't match falls
// through to the real API call against this incident's evidence pack.
const GENERAL_APP_PATTERNS = [
  /who are you/i,
  /what (is|are) (this app|riskline)/i,
  /what can you do/i,
  /how does this (app|work)/i,
  /what do you do/i,
];

function guardAnswer(question: string): string | null {
  if (!GENERAL_APP_PATTERNS.some((p) => p.test(question))) return null;
  return "I'm Jerry — I explain the evidence behind incidents detected in Riskline. Ask me about this incident's cause, evidence, or what to do next, and I'll answer from its evidence pack.";
}

export default function AskJerryPage() {
  const { id } = useParams<{ id: string }>();
  const dataset = useDataset();
  const { getMessages, addMessage, clearChat } = useChat();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // built_in and upload share the same incident_id namespace (I-001..
  // I-005), so the chat key must include the dataset — otherwise switching
  // between them would show the wrong conversation.
  const chatKey = `${dataset}:${id}`;
  const messages = getMessages(chatKey);
  const isEmpty = messages.length === 0;

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    addMessage(chatKey, { role: "user", content: trimmed });
    setInput("");

    const guard = guardAnswer(trimmed);
    if (guard) {
      addMessage(chatKey, { role: "jerry", content: guard });
      return;
    }

    setLoading(true);
    try {
      const res = await api.postAsk(id, trimmed, { dataset });
      addMessage(chatKey, {
        role: "jerry",
        content: res.answer,
        source: res.source,
        verifierWarnings: res.verifier_warnings,
      });
    } catch {
      addMessage(chatKey, {
        role: "jerry",
        content: "I couldn't reach the evidence service just now. Try again in a moment.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
      className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-2 shadow-lg shadow-black/20 transition-colors focus-within:border-accent/50"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about this incident…"
        disabled={loading}
        className="flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
      />
      <Button
        type="submit"
        size="icon"
        disabled={loading || !input.trim()}
        className="shrink-0 rounded-full"
      >
        <ArrowUp className="size-4" />
      </Button>
    </form>
  );

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col">
      {isEmpty ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6">
          <p className="max-w-sm text-center text-base leading-relaxed text-muted">
            I explain this incident&apos;s evidence — ask me anything about it.
          </p>
          <SuggestedChips onSelect={send} />
          <div className="w-full">{composer}</div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearChat(chatKey)}
                className="gap-2 text-muted"
              >
                <Trash2 className="size-3.5" />
                Clear chat
              </Button>
            </div>

            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <ChatMessageView key={m.id} message={m} />
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" />
                Jerry is checking the evidence…
              </div>
            )}
          </div>

          <div className="sticky bottom-6 mt-8">{composer}</div>
        </>
      )}
    </div>
  );
}
