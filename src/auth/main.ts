import { randomBytes } from "node:crypto";
import process from "node:process";
import { readGoogleClient } from "../config.ts";
import { buildAuthorizationUrl } from "./buildAuthorizationUrl.ts";
import { createPkcePair } from "./createPkcePair.ts";
import { exchangeCodeForRefreshToken } from "./exchangeCodeForRefreshToken.ts";
import { listenForAuthorizationCode } from "./listenForAuthorizationCode.ts";

const STATE_BYTES = 16;

async function requestRefreshToken(): Promise<string> {
  const client = readGoogleClient(process.env);
  const pkce = createPkcePair();
  const state = randomBytes(STATE_BYTES).toString("base64url");
  const listener = await listenForAuthorizationCode(state);

  try {
    console.info("Abre esta dirección en el navegador y concede el permiso:\n");
    console.info(
      buildAuthorizationUrl({
        clientId: client.clientId,
        redirectUri: listener.redirectUri,
        codeChallenge: pkce.challenge,
        state,
      }),
    );
    console.info("\nEsperando el consentimiento...");

    return await exchangeCodeForRefreshToken({
      client,
      code: await listener.code,
      codeVerifier: pkce.verifier,
      redirectUri: listener.redirectUri,
    });
  } finally {
    listener.close();
  }
}

try {
  const refreshToken = await requestRefreshToken();
  console.info("\nRefresh token. Guárdalo en GMAIL_REFRESH_TOKEN y no lo compartas con nadie:\n");
  console.info(refreshToken);
  console.info("\nQueda en el historial de esta terminal. Ciérrala cuando lo hayas guardado.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "No se pudo obtener el refresh token.",
  );
  process.exitCode = 1;
}
