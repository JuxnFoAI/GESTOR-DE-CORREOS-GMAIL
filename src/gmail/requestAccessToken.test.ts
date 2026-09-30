import { describe, expect, it, vi } from "vitest";
import type { FetchLike } from "../lib/FetchLike.ts";
import { GmailRequestError } from "./GmailRequestError.ts";
import { requestAccessToken } from "./requestAccessToken.ts";

const credentials = {
  clientId: "cliente",
  clientSecret: "secreto",
  refreshToken: "refresh",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("requestAccessToken", () => {
  it("returns the access token when Google accepts the refresh token", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ access_token: "ya29.token" });

    await expect(requestAccessToken(credentials, fetchImpl)).resolves.toBe("ya29.token");
  });

  it("sends the credentials as a form encoded refresh grant", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => jsonResponse({ access_token: "ya29.token" }));

    await requestAccessToken(credentials, fetchImpl);

    const body = new URLSearchParams(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body.get("grant_type")).toBe("refresh_token");
  });

  it("throws with the HTTP status when Google rejects the credentials", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ error: "invalid_grant" }, 400);

    await expect(requestAccessToken(credentials, fetchImpl)).rejects.toMatchObject({
      name: "GmailRequestError",
      status: 400,
    });
  });

  it("never leaks the response body in the error message", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ error_description: "refresh token ya29.secreto" }, 400);

    await expect(requestAccessToken(credentials, fetchImpl)).rejects.toThrow(
      /^Google rechazó el refresh token \(HTTP 400\)\.$/,
    );
  });

  it("throws when the payload has no access token", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ token_type: "Bearer" });

    await expect(requestAccessToken(credentials, fetchImpl)).rejects.toThrow(GmailRequestError);
  });

  it("throws when the body is not valid JSON", async () => {
    const fetchImpl: FetchLike = async () => new Response("<html>error</html>", { status: 200 });

    await expect(requestAccessToken(credentials, fetchImpl)).rejects.toThrow(
      "Google no devolvió un access token.",
    );
  });
});
