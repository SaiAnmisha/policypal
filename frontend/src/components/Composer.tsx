import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

type Props = {
  asking: boolean;
  onSend: (question: string) => void;
  onStop: () => void;
};

export default function Composer({ asking, onSend, onStop }: Props) {
  const [text, setText] = useState("");

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!text.trim() || asking) return;
    onSend(text);
    setText("");
  }

  // Enter sends, Shift + Enter adds a new line
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about notice periods, leave, sickness…"
          rows={1}
          aria-label="Your question"
        />
        {asking ? (
          <button type="button" className="btn btn-secondary" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!text.trim()}
          >
            Ask
          </button>
        )}
      </form>
      <p className="composer-hint">
        Enter to send, Shift + Enter for a new line
      </p>
    </div>
  );
}
