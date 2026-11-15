import { useState } from "react";
import type { Message, Source } from "../types";

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="row row-user">
        <div className="bubble bubble-user">{message.text}</div>
      </div>
    );
  }

  const thinking = message.status === "streaming" && message.text === "";

  return (
    <div className="row row-assistant">
      <div className="avatar" aria-hidden="true">
        P
      </div>
      <div
        className={`bubble bubble-assistant ${message.status === "error" ? "is-error" : ""}`}
      >
        {thinking ? (
          <TypingDots />
        ) : (
          <p className="answer">
            {message.text}
            {message.status === "streaming" && (
              <span className="caret" aria-hidden="true" />
            )}
          </p>
        )}
        {message.sources.length > 0 && <SourceList sources={message.sources} />}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Several chunks can come from the same page, so show each page once
  const unique = sources.filter(
    (s, i) =>
      sources.findIndex(
        (o) => o.fileName === s.fileName && o.page === s.page,
      ) === i,
  );
  const open = openIndex !== null ? unique[openIndex] : null;

  return (
    <div className="sources">
      <span className="sources-label">Sources</span>
      <div className="source-chips">
        {unique.map((s, i) => (
          <button
            key={`${s.fileName}-${s.page}`}
            type="button"
            className={`source-chip ${openIndex === i ? "is-open" : ""}`}
            aria-expanded={openIndex === i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="page-badge">p. {s.page ?? "?"}</span>
            <span className="source-file">{s.fileName}</span>
          </button>
        ))}
      </div>
      {open && <blockquote className="quote">{open.snippet}</blockquote>}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="typing" aria-label="Thinking">
      <span />
      <span />
      <span />
    </span>
  );
}
