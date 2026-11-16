import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type ComposerProps = {
  disabled: boolean;
  streaming: boolean;
  onAsk: (question: string) => void;
  onStop: () => void;
};

export default function Composer({
  disabled,
  streaming,
  onAsk,
  onStop,
}: ComposerProps) {
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLTextAreaElement>(null);

  // Grow the box with the text, up to the max height in CSS
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  }, [text]);

  function submit() {
    const question = text.trim();
    if (!question || disabled || streaming) return;
    onAsk(question);
    setText("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  // Enter sends, Shift + Enter adds a new line
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-box">
        <label htmlFor="question" className="visually-hidden">
          Your question
        </label>
        <textarea
          id="question"
          ref={boxRef}
          rows={1}
          maxLength={1000}
          value={text}
          disabled={disabled}
          placeholder={
            disabled
              ? "Upload a document to start asking"
              : "Ask about notice periods, leave, sickness…"
          }
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {streaming ? (
          <button type="button" className="btn-stop" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="btn-ask"
            disabled={disabled || !text.trim()}
          >
            Ask
          </button>
        )}
      </div>
      <p className="composer-hint">
        Enter to send, Shift + Enter for a new line
      </p>
    </form>
  );
}
