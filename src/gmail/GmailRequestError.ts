/**
 * Fallo de una llamada a la API de Gmail.
 * `status` es el código HTTP, o `null` cuando la respuesta llegó pero no tenía la forma esperada.
 */
export class GmailRequestError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null, options?: ErrorOptions) {
    super(message, options);
    this.name = "GmailRequestError";
    this.status = status;
  }
}
