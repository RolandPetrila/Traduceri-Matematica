/**
 * fetch with exponential backoff. Retries ONLY on 5xx / network errors, never
 * on 4xx client errors. Cancelled requests (AbortController) are NOT retried —
 * the AbortError propagates immediately so the caller can ignore it (a language
 * switch aborts the previous in-flight request; retrying it would fight the abort).
 */
export async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  const signal = init?.signal;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (attempt > 0) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** (attempt - 1)));
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    }
    try {
      const res = await fetch(input, init);
      if (res.status < 500) return res; // success or client error — do not retry
      lastErr = new Error(`Server error ${res.status}`);
    } catch (err) {
      // Never retry a cancelled request — surface AbortError to the caller.
      if (err instanceof Error && err.name === "AbortError") throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}
