import type { GmailMessage } from "../gmail/types.ts";
import { parseSenderAddress } from "./parseSenderAddress.ts";
import type { InboxMessage } from "./types.ts";

const UNKNOWN_SENDER_LABEL = "remitente desconocido";
const UNKNOWN_SUBJECT_LABEL = "(sin asunto)";

/** Pasa un mensaje de la API al dominio: dirección comparable y textos listos para el resumen. */
export function toInboxMessage(message: GmailMessage): InboxMessage {
  const senderAddress = parseSenderAddress(message.from);
  return {
    id: message.id,
    senderAddress,
    senderLabel: senderAddress ?? withFallback(message.from, UNKNOWN_SENDER_LABEL),
    subject: withFallback(message.subject, UNKNOWN_SUBJECT_LABEL),
    receivedAt: message.receivedAt,
  };
}

function withFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? fallback : trimmed;
}
