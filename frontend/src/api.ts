import type { DocumentInfo, Source, UploadResult } from "./types";

// Reads the error text from a Problem Details response, with a fallback
async function errorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.detail ?? body?.message ?? `${fallback} (${response.status})`;
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const response = await fetch("/documents");
  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Could not load your documents"),
    );
  }
  return response.json();
}

export async function uploadPdf(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/documents", { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(await errorMessage(response, "Upload failed"));
  }
  return response.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/documents/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Could not delete the document"),
    );
  }
}

type StreamHandlers = {
  onToken: (text: string) => void;
  onSources: (sources: Source[]) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

// Opens GET /ask/stream and calls a handler for each event
export function streamAnswer(
  question: string,
  handlers: StreamHandlers,
): () => void {
  const url = `/ask/stream?question=${encodeURIComponent(question)}`;
  const events = new EventSource(url);

  events.addEventListener("token", (e) => {
    const data = JSON.parse((e as MessageEvent).data);
    handlers.onToken(data.text);
  });

  events.addEventListener("sources", (e) => {
    handlers.onSources(JSON.parse((e as MessageEvent).data));
  });

  events.addEventListener("done", () => {
    events.close();
    handlers.onDone();
  });

  events.onerror = () => {
    events.close();
    handlers.onError("Something went wrong while getting the answer.");
  };

  // Lets the caller stop the stream early
  return () => events.close();
}
