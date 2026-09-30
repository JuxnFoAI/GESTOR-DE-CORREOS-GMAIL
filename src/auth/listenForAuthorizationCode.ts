import { once } from "node:events";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readAuthorizationResult } from "./readAuthorizationResult.ts";

const LOOPBACK_HOST = "127.0.0.1";
const ANY_FREE_PORT = 0;
const CONSENT_TIMEOUT_MS = 5 * 60 * 1000;

export type AuthorizationListener = {
  /** Loopback que hay que poner como `redirect_uri`. El puerto lo asigna el sistema. */
  readonly redirectUri: string;
  readonly code: Promise<string>;
  readonly close: () => void;
};

/**
 * Levanta un servidor local que espera la redirección de Google una sola vez.
 * Escucha solo en 127.0.0.1, así que no queda expuesto a la red.
 */
export async function listenForAuthorizationCode(
  expectedState: string,
): Promise<AuthorizationListener> {
  const server = createServer();
  server.listen(ANY_FREE_PORT, LOOPBACK_HOST);
  await Promise.race([
    once(server, "listening"),
    once(server, "error").then(([error]: unknown[]) => {
      throw error;
    }),
  ]);

  const address = server.address();
  if (address === null || typeof address === "string") {
    server.close();
    throw new Error("No se pudo abrir un puerto local para recibir el consentimiento.");
  }
  const redirectUri = `http://${LOOPBACK_HOST}:${address.port}`;

  const code = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Se agotó el tiempo de espera del consentimiento."));
    }, CONSENT_TIMEOUT_MS);

    server.on("request", (request: IncomingMessage, response: ServerResponse) => {
      const url = new URL(request.url ?? "/", redirectUri);
      if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
        // El navegador también pide cosas como /favicon.ico; no son la redirección.
        response.writeHead(404).end();
        return;
      }

      const result = readAuthorizationResult(url, expectedState);
      respondWith(response, result.message);
      clearTimeout(timeout);
      if (result.kind === "code") {
        resolve(result.code);
      } else {
        reject(new Error(result.message));
      }
    });
  });

  return { redirectUri, code, close: () => void server.close() };
}

function respondWith(response: ServerResponse, message: string): void {
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end(`${message}\n`);
}
