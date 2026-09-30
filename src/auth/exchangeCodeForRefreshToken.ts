import type { GoogleClient } from "../config.ts";
import { GmailRequestError } from "../gmail/GmailRequestError.ts";
import { asRecord } from "../lib/asRecord.ts";
import type { FetchLike } from "../lib/FetchLike.ts";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REQUEST_TIMEOUT_MS = 10_000;

export type CodeExchange = {
  readonly client: GoogleClient;
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
};

/**
 * Cambia el código de un solo uso por el refresh token, que es la credencial de larga vida.
 * No se escribe en ningún archivo: quien lo llama decide qué hacer con él.
 */
export async function exchangeCodeForRefreshToken(
  exchange: CodeExchange,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: exchange.client.clientId,
      client_secret: exchange.client.clientSecret,
      code: exchange.code,
      code_verifier: exchange.codeVerifier,
      redirect_uri: exchange.redirectUri,
      grant_type: "authorization_code",
    }).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new GmailRequestError(
      `Google rechazó el código de autorización (HTTP ${response.status}).`,
      response.status,
    );
  }

  return readRefreshToken(await response.json().catch(() => null));
}

function readRefreshToken(payload: unknown): string {
  const refreshToken = asRecord(payload)?.refresh_token;
  if (typeof refreshToken !== "string" || refreshToken === "") {
    throw new GmailRequestError(
      "Google no devolvió refresh token. Revoca el acceso de la aplicación en tu cuenta y repite el permiso.",
    );
  }
  return refreshToken;
}
