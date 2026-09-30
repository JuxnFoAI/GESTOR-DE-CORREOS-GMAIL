import type { OutgoingEmail } from "./types.ts";

/**
 * Serializa el correo como mensaje RFC 2822 en base64url, el formato que espera `messages.send`.
 * El asunto va codificado en base64 (RFC 2047) y el cuerpo también, así los acentos y los saltos
 * de línea no rompen las cabeceras.
 */
export function encodeRfc2822Message(email: OutgoingEmail): string {
  const message = [
    `To: ${assertSingleLine(email.to, "destinatario")}`,
    `Subject: =?UTF-8?B?${toBase64(assertSingleLine(email.subject, "asunto"))}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(email.body),
  ].join("\r\n");

  return toBase64Url(message);
}

/** Un salto de línea en una cabecera permitiría inyectar cabeceras nuevas. */
function assertSingleLine(value: string, field: string): string {
  if (/[\r\n]/.test(value)) {
    throw new TypeError(`El ${field} del correo no puede contener saltos de línea.`);
  }
  return value;
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
