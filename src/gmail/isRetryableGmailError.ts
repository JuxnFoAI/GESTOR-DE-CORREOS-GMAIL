import { GmailRequestError } from "./GmailRequestError.ts";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Solo merece reintento lo que puede arreglarse esperando: cuota agotada, error del servidor,
 * red caída (`TypeError` de fetch) o timeout (`TimeoutError` de AbortSignal).
 */
export function isRetryableGmailError(error: unknown): boolean {
  if (error instanceof GmailRequestError) {
    return error.status !== null && RETRYABLE_STATUSES.has(error.status);
  }
  if (error instanceof DOMException) {
    return error.name === "TimeoutError";
  }
  return error instanceof TypeError;
}
