import { useEffect, useRef, useState } from "react";
import {
  addSample,
  deleteDocument,
  listDocuments,
  streamAnswer,
  uploadPdf,
  UnauthorizedError,
} from "../api";
import type { Session } from "../auth";
import type { DocumentInfo, Message, ToastItem, UploadState } from "../types";
import Sidebar from "./Sidebar";
import ChatThread from "./ChatThread";
import Composer from "./Composer";
import Toasts from "./Toasts";
import { Brand } from "./Logo";

const MAX_BYTES = 20 * 1024 * 1024;

type WorkspaceProps = {
  session: Session;
  onLogout: () => void;
};

export default function Workspace({ session, onLogout }: WorkspaceProps) {
  const token = session.token;
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [addingSample, setAddingSample] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  const toastId = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the phone menu and put keyboard focus back on the ☰ button
  function closeMenu() {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  // Escape closes the phone menu
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const isStreaming = messages.some((m) => m.status === "streaming");

  // Toasts disappear on their own after 4 seconds
  function notify(kind: ToastItem["kind"], text: string) {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, kind, text }]);
    setTimeout(() => dismissToast(id), 4000);
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  // An expired login sends you back to the login page
  function handleError(err: unknown) {
    if (err instanceof UnauthorizedError) onLogout();
    else
      notify(
        "error",
        err instanceof Error ? err.message : "Something went wrong.",
      );
  }

  async function refreshDocuments() {
    try {
      setDocuments(await listDocuments(token));
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingDocs(false);
    }
  }

  // Load documents once when the workspace opens, and stop any answer when it closes
  useEffect(() => {
    let ignore = false;

    listDocuments(token)
      .then((docs) => {
        if (!ignore) setDocuments(docs);
      })
      .catch((err) => {
        if (!ignore) handleError(err);
      })
      .finally(() => {
        if (!ignore) setLoadingDocs(false);
      });

    return () => {
      ignore = true;
      stopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      notify("error", "Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      notify("error", "That file is over 20 MB.");
      return;
    }

    setUpload({ fileName: file.name, percent: 0, stage: "uploading" });
    try {
      const result = await uploadPdf(file, token, (percent) =>
        setUpload({
          fileName: file.name,
          percent,
          stage: percent < 100 ? "uploading" : "processing",
        }),
      );
      notify("success", `${result.fileName} is ready`);
      await refreshDocuments();
    } catch (err) {
      handleError(err);
    } finally {
      setUpload(null);
    }
  }

  async function handleAddSample() {
    setAddingSample(true);
    try {
      const result = await addSample(token);
      notify("success", `${result.fileName} is ready`);
      await refreshDocuments();
    } catch (err) {
      handleError(err);
    } finally {
      setAddingSample(false);
    }
  }

  async function handleDelete(doc: DocumentInfo) {
    if (
      !window.confirm(`Delete ${doc.fileName}? You can upload it again later.`)
    )
      return;
    try {
      await deleteDocument(doc.id, token);
      setDocuments((current) => current.filter((d) => d.id !== doc.id));
      notify("success", `${doc.fileName} deleted`);
    } catch (err) {
      handleError(err);
    }
  }

  function handleAsk(question: string) {
    const answerId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: question,
        sources: [],
        status: "done",
      },
      {
        id: answerId,
        role: "assistant",
        text: "",
        sources: [],
        status: "streaming",
      },
    ]);

    // Changes only the answer we're streaming into
    const updateAnswer = (change: (m: Message) => Message) =>
      setMessages((current) =>
        current.map((m) => (m.id === answerId ? change(m) : m)),
      );

    stopRef.current = streamAnswer(question, token, {
      onToken: (text) => updateAnswer((m) => ({ ...m, text: m.text + text })),
      onSources: (sources) => updateAnswer((m) => ({ ...m, sources })),
      onDone: () => {
        updateAnswer((m) =>
          m.status === "streaming" ? { ...m, status: "done" } : m,
        );
        stopRef.current = null;
      },
      onError: (message) => {
        updateAnswer((m) => ({
          ...m,
          text: m.text || message,
          status: "error",
        }));
        stopRef.current = null;
      },
      onUnauthorized: onLogout,
    });
  }

  function handleStop() {
    stopRef.current?.();
    stopRef.current = null;
    setMessages((current) =>
      current.map((m) =>
        m.status === "streaming" ? { ...m, status: "stopped" } : m,
      ),
    );
  }

  return (
    <div className="app">
      <Sidebar
        email={session.email}
        documents={documents}
        loadingDocs={loadingDocs}
        upload={upload}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onLogout={onLogout}
        open={menuOpen}
        onClose={closeMenu}
      />

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <main className="chat">
        <div className="mobile-bar">
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Brand size={26} />
        </div>

        <header className="chat-header">
          <h1>Ask your documents</h1>
          <p>
            Answers come only from your uploaded PDFs, with the page they came
            from.
          </p>
        </header>

        <ChatThread
          messages={messages}
          hasDocuments={documents.length > 0}
          loadingDocs={loadingDocs}
          addingSample={addingSample}
          onAddSample={handleAddSample}
          onAsk={handleAsk}
        />

        <Composer
          disabled={documents.length === 0}
          streaming={isStreaming}
          onAsk={handleAsk}
          onStop={handleStop}
        />
      </main>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
