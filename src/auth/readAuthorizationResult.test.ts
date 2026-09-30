import { describe, expect, it } from "vitest";
import { readAuthorizationResult } from "./readAuthorizationResult.ts";

const BASE = "http://127.0.0.1:53201";

function redirect(query: string): URL {
  return new URL(`${BASE}/?${query}`);
}

describe("readAuthorizationResult", () => {
  it("returns the code when the state matches", () => {
    const result = readAuthorizationResult(redirect("code=4/abc&state=estado"), "estado");

    expect(result).toMatchObject({ kind: "code", code: "4/abc" });
  });

  it("rejects a code that comes with the wrong state", () => {
    const result = readAuthorizationResult(redirect("code=4/abc&state=otro"), "estado");

    expect(result.kind).toBe("error");
  });

  it("rejects a code that comes without state", () => {
    expect(readAuthorizationResult(redirect("code=4/abc"), "estado").kind).toBe("error");
  });

  it("reports the error Google sends when the user declines", () => {
    const result = readAuthorizationResult(redirect("error=access_denied"), "estado");

    expect(result.message).toContain("access_denied");
  });

  it("checks the error before the state", () => {
    const result = readAuthorizationResult(redirect("error=access_denied&state=otro"), "estado");

    expect(result.message).toContain("access_denied");
  });

  it("rejects a redirect with the right state but no code", () => {
    const result = readAuthorizationResult(redirect("state=estado"), "estado");

    expect(result.message).toContain("no trae el código");
  });
});
