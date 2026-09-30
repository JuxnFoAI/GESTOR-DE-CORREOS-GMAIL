import { describe, expect, it, vi } from "vitest";
import type { FetchLike } from "../lib/FetchLike.ts";
import { exchangeCodeForRefreshToken } from "./exchangeCodeForRefreshToken.ts";

const exchange = {
  client: { clientId: "cliente", clientSecret: "secreto" },
  code: "4/abc",
  codeVerifier: "verificador",
  redirectUri: "http://127.0.0.1:53201",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("exchangeCodeForRefreshToken", () => {
  it("returns the refresh token when Google accepts the code", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ refresh_token: "1//token" });

    await expect(exchangeCodeForRefreshToken(exchange, fetchImpl)).resolves.toBe("1//token");
  });

  it("sends the authorization code grant with the PKCE verifier", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => jsonResponse({ refresh_token: "1//token" }));

    await exchangeCodeForRefreshToken(exchange, fetchImpl);

    const body = new URLSearchParams(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code_verifier")).toBe("verificador");
  });

  it("throws with the status when Google rejects the code", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ error: "invalid_grant" }, 400);

    await expect(exchangeCodeForRefreshToken(exchange, fetchImpl)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("never leaks the response body in the error message", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ error_description: "code 4/secreto" }, 400);

    await expect(exchangeCodeForRefreshToken(exchange, fetchImpl)).rejects.toThrow(
      /^Google rechazó el código de autorización \(HTTP 400\)\.$/,
    );
  });

  it("explains what to do when Google returns no refresh token", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ access_token: "ya29.token" });

    await expect(exchangeCodeForRefreshToken(exchange, fetchImpl)).rejects.toThrow(
      /Revoca el acceso/,
    );
  });

  it("fails when the body is not valid JSON", async () => {
    const fetchImpl: FetchLike = async () => new Response("<html>", { status: 200 });

    await expect(exchangeCodeForRefreshToken(exchange, fetchImpl)).rejects.toThrow(
      /no devolvió refresh token/,
    );
  });
});
