"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { Source } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "jerry";
  content: string;
  source?: Source;
  verifierWarnings?: string[];
  isError?: boolean;
}

interface ChatContextValue {
  getMessages: (incidentId: string) => ChatMessage[];
  addMessage: (incidentId: string, message: Omit<ChatMessage, "id">) => void;
  clearChat: (incidentId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Keyed by incident id and held at the AppShell level (alongside
// SelectedIncidentProvider) so a conversation survives switching between
// Diagnosis/Evidence/Ask Jerry for the same incident, but a different
// incident always starts from zero messages — no cross-incident bleed,
// no persistence beyond this browser tab (matches PRD's no-persistence
// scope).
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const idCounter = useRef(0);

  const getMessages = useCallback((incidentId: string) => chats[incidentId] ?? [], [chats]);

  const addMessage = useCallback((incidentId: string, message: Omit<ChatMessage, "id">) => {
    const full: ChatMessage = { ...message, id: String(++idCounter.current) };
    setChats((prev) => ({ ...prev, [incidentId]: [...(prev[incidentId] ?? []), full] }));
  }, []);

  const clearChat = useCallback((incidentId: string) => {
    setChats((prev) => ({ ...prev, [incidentId]: [] }));
  }, []);

  return (
    <ChatContext.Provider value={{ getMessages, addMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
}
