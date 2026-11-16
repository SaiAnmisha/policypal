import { useState } from "react";
import type { Message } from "../types";
import Logo from "./Logo";

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [openSource, setOpenSource] = useState<number | null>(null);

  if (message.role === "user") {
    return <div className="msg-user">{message.text}</div>;
  }

  const waiting = message.status === "streaming" && message.text === "";
  const opened = openSource !== null ? message.sources[openSource] : null;

  return (
    <div className="msg-assistant">
      <Logo size={32} />
      <div className={`bubble ${message.status === "error" ? "error" : ""}`}>
        {waiting ? (
          <div className="typing" aria-label="PolicyPal is thinking">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <p className="bubble-text">
            {message.text}
            {message.status === "streaming" && (
              <span className="caret" aria-hidden="true" />
            )}
          </p>
        )}

        {message.status === "stopped" && (
          <p className="stopped-note">Stopped</p>
        )}

        {message.sources.length > 0 && (
          <div className="sources">
            <p className="sources-label">SOURCES</p>
            <div className="chips">
              {message.sources.map((source, index) => (
                <button
                  key={`${source.fileName}-${source.page}`}
                  type="button"
                  className="chip"
                  aria-expanded={openSource === index}
                  onClick={() =>
                    setOpenSource(openSource === index ? null : index)
                  }
                >
                  <span className="chip-page">p. {source.page}</span>
                  <span className="chip-file">{source.fileName}</span>
                </button>
              ))}
            </div>
            {opened && <blockquote className="quote">{opened.text}</blockquote>}
          </div>
        )}
      </div>
    </div>
  );
}
