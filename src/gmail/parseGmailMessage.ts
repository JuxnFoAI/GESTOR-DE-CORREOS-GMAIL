import { asRecord } from "../lib/asRecord.ts";
import type { GmailMessage } from "./types.ts";

const FROM_HEADER = "from";
const SUBJECT_HEADER = "subject";

/**
 * Normaliza la respuesta de `messages.get` con `format=metadata`.
 * Devuelve `null` si falta el id, porque sin id no se puede actuar sobre el mensaje.
 */
export function parseGmailMessage(payload: unknown): GmailMessage | null {
  const message = asRecord(payload);
  if (message === null) {
    return null;
  }

  const id = message.id;
  if (typeof id !== "string" || id === "") {
    return null;
  }

  const headers = readHeaders(message.payload);
  return {
    id,
    from: headers.get(FROM_HEADER) ?? "",
    subject: headers.get(SUBJECT_HEADER) ?? "",
    receivedAt: readReceivedAt(message.internalDate),
  };
}

/** Indexa las cabeceras por nombre en minúsculas y conserva la primera aparición de cada una. */
function readHeaders(payload: unknown): Map<string, string> {
  const headers = new Map<string, string>();
  const rawHeaders = asRecord(payload)?.headers;
  if (!Array.isArray(rawHeaders)) {
    return headers;
  }

  for (const rawHeader of rawHeaders) {
    const header = asRecord(rawHeader);
    const name = header?.name;
    const value = header?.value;
    if (typeof name === "string" && typeof value === "string" && !headers.has(name.toLowerCase())) {
      headers.set(name.toLowerCase(), value);
    }
  }
  return headers;
}

/** `internalDate` llega como milisegundos epoch en texto. */
function readReceivedAt(raw: unknown): Date | null {
  if (typeof raw !== "string") {
    return null;
  }
  const epochMs = Number(raw);
  if (!Number.isFinite(epochMs) || epochMs <= 0) {
    return null;
  }
  return new Date(epochMs);
}
