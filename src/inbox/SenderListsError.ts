/** `senders.json` no se pudo leer o no cumple las reglas de las listas. */
export class SenderListsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SenderListsError";
  }
}
