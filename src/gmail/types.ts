/** Mensaje tal como lo devuelve la API, ya normalizado a tipos de JavaScript. */
export type GmailMessage = {
  readonly id: string;
  readonly from: string;
  readonly subject: string;
  readonly receivedAt: Date | null;
};

export type EmailContent = {
  readonly subject: string;
  readonly body: string;
};

export type OutgoingEmail = EmailContent & {
  readonly to: string;
};
