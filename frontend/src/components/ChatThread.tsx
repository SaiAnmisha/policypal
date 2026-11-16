import { useEffect, useRef } from "react";
import type { Message } from "../types";
import MessageBubble from "./MessageBubble";

const SUGGESTIONS = [
  "How much notice do I give after three years?",
  "How much annual leave do I get?",
  "Can I work from home?",
  "If I resign today, what is my last working day?",
];

type ChatThreadProps = {
  messages: Message[];
  hasDocuments: boolean;
  loadingDocs: boolean;
  addingSample: boolean;
  onAddSample: () => void;
  onAsk: (question: string) => void;
};

export default function ChatThread({
  messages,
  hasDocuments,
  loadingDocs,
  addingSample,
  onAddSample,
  onAsk,
}: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest text in view while an answer streams in
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    if (loadingDocs) return <div className="thread" />;

    if (!hasDocuments) {
      return (
        <div className="thread">
          <div className="empty">
            <div>
              <h2>Upload a document to get started</h2>
              <p className="empty-sub">
                Drop a PDF in the sidebar, or try PolicyPal with our sample
                handbook.
              </p>
            </div>
            <div className="sample-card">
              <span className="sample-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                  <path d="M9 13h6" />
                  <path d="M9 17h4" />
                </svg>
              </span>
              <div className="sample-text">
                <p className="sample-title">Northbridge HR handbook</p>
                <p className="sample-meta">
                  Sample · 6 pages · notice, leave, sickness, hybrid working
                </p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={onAddSample}
                disabled={addingSample}
              >
                {addingSample ? "Adding…" : "Use sample"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="thread">
        <div className="empty">
          <div>
            <h2>What would you like to know?</h2>
            <p className="empty-sub">
              Ask in plain English. Every answer shows the page it came from.
            </p>
          </div>
          <p className="suggestions-label">TRY ASKING</p>
          <div className="suggestions">
            {SUGGESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="suggestion"
                onClick={() => onAsk(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thread">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
