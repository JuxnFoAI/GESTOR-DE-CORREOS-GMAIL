/** Mensaje del dominio: el remitente ya está reducido a una dirección comparable. */
export type InboxMessage = {
  readonly id: string;
  readonly senderAddress: string | null;
  readonly senderLabel: string;
  readonly subject: string;
  readonly receivedAt: Date | null;
};

export type SenderLists = {
  readonly unwanted: readonly string[];
  readonly important: readonly string[];
};

export type Classification = {
  readonly unwanted: readonly InboxMessage[];
  readonly important: readonly InboxMessage[];
};
