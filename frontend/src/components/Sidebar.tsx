import { useRef, useState } from "react";
import type { DragEvent } from "react";
import type { UploadResult } from "../types";

type Props = {
  documents: UploadResult[];
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
};

export default function Sidebar({
  documents,
  uploading,
  error,
  onUpload,
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
          No documents uploaded in this session yet.
        </p>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.documentId} className="doc-item">
              <FileIcon />
              <div className="doc-meta">
                <span className="doc-name" title={doc.fileName}>
                  {doc.fileName}
                </span>
                <span className="doc-sub">
                  {doc.pages} pages · {doc.chunks} chunks
                </span>
              </div>
              <span className="badge">Ready</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
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
