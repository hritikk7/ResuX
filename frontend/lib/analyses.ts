import type { AnalysisDetail, AnalysisHistoryItem } from "./types";
import { createClient } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SESSION_EXPIRED = "Your session has expired. Sign in again to see your history.";

/**
 * GET an authenticated JSON endpoint, mapping failures to renderable messages.
 *
 * Client-side by design: it mirrors the token handling in `analyze.ts`, which is
 * the only other FastAPI client in the app. The backend requires the access token
 * (backend/api/deps.py) and scopes every row to that user.
 *
 * Throws a plain Error whose message is safe to show — the caller decides how.
 */
async function authedGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error(SESSION_EXPIRED);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  } catch (e) {
    // An aborted request is a cancelled render, not a failure to report.
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new Error("Could not reach the analysis server. Is the backend running?");
  }

  if (response.status === 401) {
    throw new Error(SESSION_EXPIRED);
  }
  // The backend returns 404 both for "no such id" and "not yours" — it never
  // distinguishes the two, so neither does this message.
  if (response.status === 404) {
    throw new NotFoundError("That analysis doesn't exist, or isn't yours.");
  }
  if (response.status === 503) {
    throw new Error("Your history is temporarily unavailable. Try again in a moment.");
  }
  if (!response.ok) {
    throw new Error(`Could not load your history (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

/** Lets the detail page skip a Retry button — retrying a 404 changes nothing. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The signed-in user's past analyses, newest first. */
export function fetchAnalyses(signal?: AbortSignal): Promise<AnalysisHistoryItem[]> {
  return authedGet<AnalysisHistoryItem[]>("/analyses", signal);
}

/** One saved analysis. Throws NotFoundError if it doesn't exist or isn't theirs. */
export function fetchAnalysis(id: string, signal?: AbortSignal): Promise<AnalysisDetail> {
  return authedGet<AnalysisDetail>(`/analyses/${encodeURIComponent(id)}`, signal);
}
