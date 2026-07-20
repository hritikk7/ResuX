import type {
  AnalysisResult,
  BulletResult,
  ErrorPayload,
  ResultPartial,
  SSEEvent,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB, per PRD section 1
export const ACCEPTED_FILE_TYPES = [".pdf", ".txt"];

export interface AnalyzeHandlers {
  onStatus?: (status: string) => void;
  onPartial?: (partial: ResultPartial) => void;
  onBullet?: (bullet: BulletResult) => void;
  onFinal?: (result: AnalysisResult) => void;
  onError?: (error: ErrorPayload) => void;
}

/**
 * POST the resume + job description to /analyze and stream the SSE response,
 * dispatching each parsed event to the matching handler as it arrives.
 *
 * Uses fetch + a stream reader rather than EventSource, since EventSource
 * cannot send a multipart POST body.
 */
export async function analyzeResume(
  file: File,
  jobDescription: string,
  handlers: AnalyzeHandlers,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("job_description", jobDescription);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch {
    handlers.onError?.({
      error: "network_error",
      message: "Could not reach the analysis server. Is the backend running?",
    });
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError?.({
      error: "http_error",
      message: `Analysis request failed (HTTP ${response.status}).`,
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line ("\n\n").
    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      dispatchFrame(frame, handlers);
    }
  }

  // Flush any trailing frame that wasn't newline-terminated.
  if (buffer.trim()) {
    dispatchFrame(buffer, handlers);
  }
}

function dispatchFrame(frame: string, handlers: AnalyzeHandlers): void {
  const line = frame
    .split("\n")
    .find((l) => l.startsWith("data:"));
  if (!line) return;

  const jsonText = line.slice("data:".length).trim();
  if (!jsonText) return;

  let event: SSEEvent;
  try {
    event = JSON.parse(jsonText) as SSEEvent;
  } catch {
    return; // ignore malformed frame rather than crash the stream
  }

  switch (event.type) {
    case "status":
      handlers.onStatus?.(event.payload);
      break;
    case "result_partial":
      handlers.onPartial?.(event.payload);
      break;
    case "bullet_result":
      handlers.onBullet?.(event.payload);
      break;
    case "result_final":
      handlers.onFinal?.(event.payload);
      break;
    case "error":
      handlers.onError?.(event.payload);
      break;
  }
}
