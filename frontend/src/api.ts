import type { Source, UploadResult } from "./types";

// Sends the PDF to POST /documents
export async function uploadPdf(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/documents", { method: "POST", body: form });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Upload failed (${response.status})`);
  }
  return response.json();
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
