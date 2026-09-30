import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./withRetry.ts";

function retryOptions(overrides: { isRetryable?: (error: unknown) => boolean } = {}) {
  return {
    attempts: 3,
    baseDelayMs: 100,
    isRetryable: overrides.isRetryable ?? (() => true),
    sleep: vi.fn<(milliseconds: number) => Promise<void>>(async () => {}),
  };
}

describe("withRetry", () => {
  it("returns the value without waiting when the operation succeeds", async () => {
    const options = retryOptions();

    await expect(withRetry(async () => "ok", options)).resolves.toBe("ok");
    expect(options.sleep).not.toHaveBeenCalled();
  });

  it("retries until the operation succeeds", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("caída"))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, retryOptions())).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("waits with exponential backoff between attempts", async () => {
    const options = retryOptions();

    await expect(
      withRetry(async () => {
        throw new Error("caída");
      }, options),
    ).rejects.toThrow("caída");
    expect(options.sleep.mock.calls).toEqual([[100], [200]]);
  });

  it("stops at the configured number of attempts", async () => {
    const operation = vi.fn<() => Promise<string>>(async () => {
      throw new Error("caída");
    });

    await expect(withRetry(operation, retryOptions())).rejects.toThrow("caída");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("propagates a non retryable error on the first attempt", async () => {
    const operation = vi.fn<() => Promise<string>>(async () => {
      throw new Error("credenciales inválidas");
    });

    await expect(
      withRetry(operation, retryOptions({ isRetryable: () => false })),
    ).rejects.toThrow("credenciales inválidas");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("rejects an attempts count below one", async () => {
    await expect(
      withRetry(async () => "ok", { ...retryOptions(), attempts: 0 }),
    ).rejects.toThrow(RangeError);
  });
});
