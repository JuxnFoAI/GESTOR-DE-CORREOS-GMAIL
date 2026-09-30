import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, GMAIL_SCOPE } from "./buildAuthorizationUrl.ts";

const request = {
  clientId: "cliente.apps.googleusercontent.com",
  redirectUri: "http://127.0.0.1:53201",
  codeChallenge: "reto",
  state: "estado",
};

function paramsOf(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe("buildAuthorizationUrl", () => {
  it("points at the Google consent screen", () => {
    expect(buildAuthorizationUrl(request).startsWith(
      "https://accounts.google.com/o/oauth2/v2/auth?",
    )).toBe(true);
  });

  it("asks for an authorization code", () => {
    expect(paramsOf(buildAuthorizationUrl(request)).get("response_type")).toBe("code");
  });

  it("asks offline access so Google returns a refresh token", () => {
    const params = paramsOf(buildAuthorizationUrl(request));

    expect(params.get("access_type")).toBe("offline");
    expect(params.get("prompt")).toBe("consent");
  });

  it("requests only the gmail.modify scope", () => {
    expect(paramsOf(buildAuthorizationUrl(request)).getAll("scope")).toEqual([GMAIL_SCOPE]);
  });

  it("never requests permission to delete permanently", () => {
    expect(buildAuthorizationUrl(request)).not.toContain("mail.google.com");
  });

  it("sends the PKCE challenge with the S256 method", () => {
    const params = paramsOf(buildAuthorizationUrl(request));

    expect(params.get("code_challenge")).toBe("reto");
    expect(params.get("code_challenge_method")).toBe("S256");
  });

  it("carries the state so the loopback can verify the response", () => {
    expect(paramsOf(buildAuthorizationUrl(request)).get("state")).toBe("estado");
  });

  it("encodes the loopback redirect", () => {
    expect(buildAuthorizationUrl(request)).toContain(
      "redirect_uri=http%3A%2F%2F127.0.0.1%3A53201",
    );
  });
});
