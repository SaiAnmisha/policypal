export type Source = {
  fileName: string;
  page: number;
  text: string;
};

export type UploadResult = {
  fileName: string;
  pages: number;
  chunks: number;
};

export type DocumentInfo = {
  id: string;
  fileName: string;
  pages: number;
  uploadedAt: string;
};

export type MessageStatus = "streaming" | "done" | "stopped" | "error";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources: Source[];
  status: MessageStatus;
};

// What the sidebar shows while a PDF is being uploaded and processed
export type UploadState = {
  fileName: string;
  percent: number;
  stage: "uploading" | "processing";
};

export type ToastItem = {
  id: number;
  kind: "success" | "error";
  text: string;
};
