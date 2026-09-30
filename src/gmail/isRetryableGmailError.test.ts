import { describe, expect, it } from "vitest";
import { GmailRequestError } from "./GmailRequestError.ts";
import { isRetryableGmailError } from "./isRetryableGmailError.ts";

describe("isRetryableGmailError", () => {
  it("retries when Gmail answers 429", () => {
    expect(isRetryableGmailError(new GmailRequestError("cuota", 429))).toBe(true);
  });

  it("retries when Gmail answers 503", () => {
    expect(isRetryableGmailError(new GmailRequestError("no disponible", 503))).toBe(true);
  });

  it("does not retry an invalid credential", () => {
    expect(isRetryableGmailError(new GmailRequestError("no autorizado", 401))).toBe(false);
  });

  it("does not retry a malformed payload", () => {
    expect(isRetryableGmailError(new GmailRequestError("respuesta inesperada"))).toBe(false);
  });

  it("retries a network failure", () => {
    expect(isRetryableGmailError(new TypeError("fetch failed"))).toBe(true);
  });

  it("retries a request timeout", () => {
    expect(isRetryableGmailError(new DOMException("agotado", "TimeoutError"))).toBe(true);
  });

  it("does not retry a cancelled request", () => {
    expect(isRetryableGmailError(new DOMException("cancelado", "AbortError"))).toBe(false);
  });
});
