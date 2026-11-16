import { useState, useEffect, useRef, type DragEvent } from "react";
import type { DocumentInfo, UploadState } from "../types";
import { Brand } from "./Logo";
import UserMenu from "./UserMenu";

type SidebarProps = {
  email: string;
  documents: DocumentInfo[];
  loadingDocs: boolean;
  upload: UploadState | null;
  onUpload: (file: File) => void;
  onDelete: (doc: DocumentInfo) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Sidebar({
  email,
  documents,
  loadingDocs,
  upload,
  onUpload,
  onDelete,
  onLogout,
  open,
  onClose,
}: SidebarProps) {
  const [dragging, setDragging] = useState(false);
  const busy = upload !== null;
  const closeRef = useRef<HTMLButtonElement>(null);

  // When the phone menu opens, move keyboard focus into it
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !busy) onUpload(file);
  }

  return (
    <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <Brand size={30} onDark />
        <button
          ref={closeRef}
          type="button"
          className="icon-btn close-btn"
          aria-label="Close menu"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <label
        className={`dropzone ${dragging ? "dragging" : ""} ${busy ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="visually-hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
        <span className="dropzone-title">Drop a PDF here</span>
        <span className="dropzone-sub">or click to browse. Max 20 MB</span>
      </label>

      {upload && (
        <div className="upload-card" role="status">
          <p className="upload-name">{upload.fileName}</p>
          <ul className="upload-steps">
            <li className={upload.stage === "processing" ? "done" : "active"}>
              <span className="step-icon" />
              {upload.stage === "uploading"
                ? `Uploading… ${upload.percent}%`
                : "Uploaded"}
            </li>
            <li className={upload.stage === "processing" ? "active" : ""}>
              <span className="step-icon" />
              Reading pages and creating embeddings…
            </li>
            <li>
              <span className="step-icon" />
              Ready to ask
            </li>
          </ul>
          <div className="progress">
            <div
              className={`progress-bar ${upload.stage === "processing" ? "indeterminate" : ""}`}
              style={
                upload.stage === "uploading"
                  ? { width: `${upload.percent}%` }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      <p className="sidebar-label">DOCUMENTS</p>

      {loadingDocs ? (
        <p className="sidebar-empty">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="sidebar-empty">
          No documents yet. Upload a PDF or try the sample.
        </p>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.id} className="doc">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
              <span className="doc-text">
                <span className="doc-name" title={doc.fileName}>
                  {doc.fileName}
                </span>
                <span className="doc-meta">
                  {doc.pages} {doc.pages === 1 ? "page" : "pages"} ·{" "}
                  {formatDate(doc.uploadedAt)}
                </span>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete ${doc.fileName}`}
                onClick={() => onDelete(doc)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                  <path d="M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="sidebar-spacer" />
      <UserMenu email={email} onLogout={onLogout} />
    </aside>
  );
}
