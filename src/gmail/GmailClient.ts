import { asRecord } from "../lib/asRecord.ts";
import type { FetchLike } from "../lib/FetchLike.ts";
import { sleep } from "../lib/sleep.ts";
import { withRetry } from "../lib/withRetry.ts";
import { encodeRfc2822Message } from "./encodeRfc2822Message.ts";
import { GmailRequestError } from "./GmailRequestError.ts";
import { isRetryableGmailError } from "./isRetryableGmailError.ts";
import { parseGmailMessage } from "./parseGmailMessage.ts";
import type { GmailMessage, OutgoingEmail } from "./types.ts";

const API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const MAX_MESSAGES_PER_RUN = 100;
const MILLISECONDS_PER_SECOND = 1000;
/** Solo las cabeceras que usa la clasificación. El cuerpo del correo nunca se descarga. */
const METADATA_QUERY = "?format=metadata&metadataHeaders=From&metadataHeaders=Subject";

export type GmailClientDeps = {
  readonly fetch?: FetchLike;
  readonly sleep?: (milliseconds: number) => Promise<void>;
};

type RequestInitLite = {
  readonly method?: string;
  readonly body?: string;
};

/** Acceso a la cuenta de Gmail autenticada. Reintenta los fallos transitorios con espera exponencial. */
export class GmailClient {
  readonly #accessToken: string;
  readonly #fetch: FetchLike;
  readonly #sleep: (milliseconds: number) => Promise<void>;

  constructor(accessToken: string, deps: GmailClientDeps = {}) {
    this.#accessToken = accessToken;
    this.#fetch = deps.fetch ?? fetch;
    this.#sleep = deps.sleep ?? sleep;
  }

  /** Dirección de la cuenta conectada. El resumen se envía aquí, nunca a un correo escrito en el código. */
  async readOwnAddress(): Promise<string> {
    const address = asRecord(await this.#request("/profile"))?.emailAddress;
    if (typeof address !== "string" || address === "") {
      throw new GmailRequestError("Gmail no devolvió la dirección de la cuenta.");
    }
    return address;
  }

  /** Mensajes de la bandeja de entrada recibidos desde `since`, hasta un tope por ejecución. */
  async listInboxMessagesSince(since: Date): Promise<GmailMessage[]> {
    const ids = await this.#listInboxMessageIds(since);
    const messages: GmailMessage[] = [];
    for (const id of ids) {
      const payload = await this.#request(this.#messagePath(id, METADATA_QUERY));
      const message = parseGmailMessage(payload);
      if (message !== null) {
        messages.push(message);
      }
    }
    return messages;
  }

  /** Mueve el mensaje a la papelera, donde Gmail lo conserva unos 30 días. */
  async trashMessage(id: string): Promise<void> {
    await this.#request(this.#messagePath(id, "/trash"), { method: "POST" });
  }

  async sendEmail(email: OutgoingEmail): Promise<void> {
    await this.#request("/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: encodeRfc2822Message(email) }),
    });
  }

  async #listInboxMessageIds(since: Date): Promise<string[]> {
    const epochSeconds = Math.floor(since.getTime() / MILLISECONDS_PER_SECOND);
    const query = new URLSearchParams({
      q: `in:inbox after:${epochSeconds}`,
      maxResults: String(MAX_MESSAGES_PER_RUN),
    });
    const messages = asRecord(await this.#request(`/messages?${query}`))?.messages;
    if (messages === undefined) {
      return [];
    }
    if (!Array.isArray(messages)) {
      throw new GmailRequestError("Gmail devolvió una lista de mensajes inesperada.");
    }
    return messages
      .map((message) => asRecord(message)?.id)
      .filter((id): id is string => typeof id === "string" && id !== "");
  }

  #messagePath(id: string, suffix: string): string {
    return `/messages/${encodeURIComponent(id)}${suffix}`;
  }

  #request(path: string, init?: RequestInitLite): Promise<unknown> {
    return withRetry(() => this.#requestOnce(path, init), {
      attempts: RETRY_ATTEMPTS,
      baseDelayMs: RETRY_BASE_DELAY_MS,
      isRetryable: isRetryableGmailError,
      sleep: this.#sleep,
    });
  }

  async #requestOnce(path: string, init?: RequestInitLite): Promise<unknown> {
    const response = await this.#fetch(`${API_BASE_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${this.#accessToken}`,
        "content-type": "application/json",
      },
      body: init?.body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new GmailRequestError(
        `Gmail respondió HTTP ${response.status} en ${path}.`,
        response.status,
      );
    }
    return await response.json().catch(() => null);
  }
}
