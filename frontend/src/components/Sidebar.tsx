import { useRef, useState } from "react";
import type { DragEvent } from "react";
import type { DocumentInfo } from "../types";

type Props = {
  documents: DocumentInfo[];
  uploading: boolean;
  deletingId: string | null;
  error: string | null;
  onUpload: (file: File) => void;
  onDelete: (doc: DocumentInfo) => void;
};

export default function Sidebar({
  documents,
  uploading,
  deletingId,
  error,
  onUpload,
  onDelete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) onUpload(file);
  }

  function openPicker() {
    if (!uploading) inputRef.current?.click();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!uploading) pick(e.dataTransfer.files);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          P
        </span>
        <span>PolicyPal</span>
      </div>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""} ${uploading ? "is-busy" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <UploadIcon />
        <p className="dropzone-title">
          {uploading ? "Reading your PDF…" : "Drop a PDF here"}
        </p>
        <p className="dropzone-hint">
          {uploading
            ? "Splitting pages and creating embeddings"
            : "or click to browse. Max 20 MB"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <h2 className="section-label">Documents</h2>
      {documents.length === 0 ? (
        <p className="muted small">
          No documents yet. Upload a PDF to get started.
        </p>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.id} className="doc-item">
              <FileIcon />
              <div className="doc-meta">
                <span className="doc-name" title={doc.fileName}>
                  {doc.fileName}
                </span>
                <span className="doc-sub">
                  {doc.pages} pages · {formatDate(doc.uploadedAt)}
                </span>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Delete ${doc.fileName}`}
                title="Delete"
                disabled={deletingId === doc.id}
                onClick={() => onDelete(doc)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}
