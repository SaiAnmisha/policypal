import { useEffect, useRef, useState } from "react";
import { deleteDocument, listDocuments, streamAnswer, uploadPdf } from "./api";
import type { DocumentInfo, Message } from "./types";
import Sidebar from "./components/Sidebar";
import ChatThread from "./components/ChatThread";
import Composer from "./components/Composer";
import "./App.css";

export default function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  // Load the saved documents once, when the page opens
  useEffect(() => {
    let ignore = false;
    listDocuments()
      .then((docs) => {
        if (!ignore) setDocuments(docs);
      })
      .catch((err) => {
        if (!ignore)
          setDocError(toMessage(err, "Could not load your documents."));
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setDocError(null);
    try {
      await uploadPdf(file);
      setDocuments(await listDocuments());
    } catch (err) {
      setDocError(toMessage(err, "Upload failed. Try again."));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DocumentInfo) {
    const confirmed = window.confirm(
      `Delete ${doc.fileName}? You won't be able to ask questions about it any more.`,
    );
    if (!confirmed) return;

    setDeletingId(doc.id);
    setDocError(null);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setDocError(toMessage(err, "Could not delete the document."));
    } finally {
      setDeletingId(null);
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
        deletingId={deletingId}
        error={docError}
        onUpload={handleUpload}
        onDelete={handleDelete}
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

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}
