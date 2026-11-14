import { useRef, useState } from "react";
import { streamAnswer, uploadPdf } from "./api";
import type { Message, UploadResult } from "./types";
import Sidebar from "./components/Sidebar";
import ChatThread from "./components/ChatThread";
import Composer from "./components/Composer";
import "./App.css";

export default function App() {
  const [documents, setDocuments] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadPdf(file);
      setDocuments((prev) => [result, ...prev]);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  // Changes only the last message (the answer that is streaming in)
  function updateLast(change: (m: Message) => Message) {
    setMessages((prev) => [
      ...prev.slice(0, -1),
      change(prev[prev.length - 1]),
    ]);
  }

  function handleAsk(question: string) {
    const q = question.trim();
    if (!q || asking) return;

    setAsking(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q, sources: [], status: "done" },
      { role: "assistant", text: "", sources: [], status: "streaming" },
    ]);

    stopRef.current = streamAnswer(q, {
      onToken: (text) => updateLast((m) => ({ ...m, text: m.text + text })),
      onSources: (sources) => updateLast((m) => ({ ...m, sources })),
      onDone: () => {
        updateLast((m) => ({ ...m, status: "done" }));
        setAsking(false);
      },
      onError: (message) => {
        updateLast((m) => ({ ...m, text: m.text || message, status: "error" }));
        setAsking(false);
      },
    });
  }

  function handleStop() {
    stopRef.current?.();
    updateLast((m) => ({ ...m, text: m.text || "Stopped.", status: "done" }));
    setAsking(false);
  }

  return (
    <div className="layout">
      <Sidebar
        documents={documents}
        uploading={uploading}
        error={uploadError}
        onUpload={handleUpload}
      />
      <main className="main">
        <header className="topbar">
          <h1>Ask your documents</h1>
          <p>
            Answers come only from your uploaded PDFs, with the page they came
            from.
          </p>
        </header>
        <ChatThread
          messages={messages}
          hasDocuments={documents.length > 0}
          onSuggestion={handleAsk}
        />
        <Composer asking={asking} onSend={handleAsk} onStop={handleStop} />
      </main>
    </div>
  );
}
