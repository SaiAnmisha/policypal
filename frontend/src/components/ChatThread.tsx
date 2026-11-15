import { useEffect, useRef } from "react";
import type { Message } from "../types";
import MessageBubble from "./MessageBubble";

const SUGGESTIONS = [
  "How much notice do I need to give after three years?",
  "If I resign on 2 March 2027 after three years, what is my last day?",
  "I started on 1 July 2026. How much annual leave do I get this year?",
  "Can I work from home?",
];

type Props = {
  messages: Message[];
  hasDocuments: boolean;
  onSuggestion: (question: string) => void;
};

export default function ChatThread({
  messages,
  hasDocuments,
  onSuggestion,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as text streams in
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <section className="thread thread-empty">
        <div className="empty">
          <h2>What do you want to know?</h2>
          <p>
            {hasDocuments
              ? "Ask anything about your uploaded documents."
              : "Upload a PDF on the left, then ask a question. Or try one of these on the sample handbook."}
          </p>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="chip"
                onClick={() => onSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="thread" aria-live="polite">
      {messages.map((m, i) => (
        <MessageBubble key={i} message={m} />
      ))}
      <div ref={endRef} />
    </section>
  );
}
