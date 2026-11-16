import type { Session } from "./auth";
import type { DocumentInfo, Source, UploadResult } from "./types";

// Thrown when the token is missing, expired or rejected
export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has expired. Log in again.");
    this.name = "UnauthorizedError";
  }
}

// Reads the error text from a Problem Details response, with a fallback
async function errorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.detail ?? body?.message ?? `${fallback} (${response.status})`;
}

async function postJson<T>(
  path: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response, fallback));
  return response.json();
}

// Adds the login token, and turns a 401 into UnauthorizedError
async function authFetch(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new UnauthorizedError();
  return response;
}

// Login, sign-up and demo

export function login(email: string, password: string): Promise<Session> {
  return postJson("/auth/login", { email, password }, "Could not log in");
}

export function register(email: string, password: string): Promise<Session> {
  return postJson(
    "/auth/register",
    { email, password },
    "Could not create your account",
  );
}

export function startDemo(): Promise<Session> {
  return postJson("/auth/demo", {}, "Could not start the demo");
}

// Documents

export async function listDocuments(token: string): Promise<DocumentInfo[]> {
  const response = await authFetch("/documents", token);
  if (!response.ok)
    throw new Error(
      await errorMessage(response, "Could not load your documents"),
    );
  return response.json();
}

export async function addSample(token: string): Promise<UploadResult> {
  const response = await authFetch("/documents/sample", token, {
    method: "POST",
  });
  if (!response.ok)
    throw new Error(await errorMessage(response, "Could not add the sample"));
  return response.json();
}

export async function deleteDocument(id: string, token: string): Promise<void> {
  const response = await authFetch(`/documents/${id}`, token, {
    method: "DELETE",
  });
  if (!response.ok)
    throw new Error(
      await errorMessage(response, "Could not delete the document"),
    );
}

// Uses XMLHttpRequest because fetch can't report upload progress
export function uploadPdf(
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/documents");
    request.setRequestHeader("Authorization", `Bearer ${token}`);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // The body was empty or not JSON
      }
      if (request.status === 401) reject(new UnauthorizedError());
      else if (request.status >= 200 && request.status < 300) resolve(body);
      else
        reject(new Error(body?.detail ?? `Upload failed (${request.status})`));
    };

    request.onerror = () =>
      reject(new Error("Upload failed. Check your connection and try again."));

    const form = new FormData();
    form.append("file", file);
    request.send(form);
  });
}

// Streaming answers

type StreamHandlers = {
  onToken: (text: string) => void;
  onSources: (sources: Source[]) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
};

// fetch instead of EventSource, because EventSource can't send the Authorization header
export function streamAnswer(
  question: string,
  token: string,
  handlers: StreamHandlers,
): () => void {
  const controller = new AbortController();

  async function run() {
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        handlers.onDone();
      }
    };

    try {
      const response = await fetch(
        `/ask/stream?question=${encodeURIComponent(question)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        },
      );

      if (response.status === 401) {
        handlers.onUnauthorized();
        return;
      }
      if (!response.ok || !response.body) {
        handlers.onError(await errorMessage(response, "Something went wrong"));
        return;
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value.replace(/\r\n/g, "\n");

        // Each event ends with a blank line
        let end = buffer.indexOf("\n\n");
        while (end !== -1) {
          const event = parseEvent(buffer.slice(0, end));
          buffer = buffer.slice(end + 2);

          if (event.name === "token")
            handlers.onToken(JSON.parse(event.data).text);
          else if (event.name === "sources")
            handlers.onSources(JSON.parse(event.data));
          else if (event.name === "done") finish();

          end = buffer.indexOf("\n\n");
        }
      }
      finish();
    } catch {
      if (!controller.signal.aborted)
        handlers.onError("Something went wrong while getting the answer.");
    }
  }

  run();
  return () => controller.abort();
}

// Turns "event:token\ndata:{...}" into { name, data }
function parseEvent(raw: string) {
  let name = "message";
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:"))
      data.push(line.slice(5).replace(/^ /, ""));
  }
  return { name, data: data.join("\n") };
}
