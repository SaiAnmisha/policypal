export type Source = {
  fileName: string;
  page: number | null;
  snippet: string;
};

export type UploadResult = {
  documentId: string;
  fileName: string;
  pages: number;
  chunks: number;
};

export type MessageStatus = "streaming" | "done" | "error";

export type Message = {
  role: "user" | "assistant";
  text: string;
  sources: Source[];
  status: MessageStatus;
};
