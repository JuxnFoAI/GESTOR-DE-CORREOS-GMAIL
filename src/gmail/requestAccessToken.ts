import type { GoogleCredentials } from "../config.ts";
import { asRecord } from "../lib/asRecord.ts";
import type { FetchLike } from "../lib/FetchLike.ts";
import { GmailRequestError } from "./GmailRequestError.ts";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Cambia el refresh token por un access token de corta vida.
 * Ningún mensaje de error incluye la respuesta de Google, para no filtrar credenciales en los logs.
 */
export async function requestAccessToken(
  credentials: GoogleCredentials,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new GmailRequestError(
      `Google rechazó el refresh token (HTTP ${response.status}).`,
      response.status,
    );
  }

  return readAccessToken(await response.json().catch(() => null));
}

function readAccessToken(payload: unknown): string {
  const accessToken = asRecord(payload)?.access_token;
  if (typeof accessToken !== "string" || accessToken === "") {
    throw new GmailRequestError("Google no devolvió un access token.");
  }
  return accessToken;
}
