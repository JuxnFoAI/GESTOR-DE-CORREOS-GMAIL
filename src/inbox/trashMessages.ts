import type { InboxMessage } from "./types.ts";

/** Lo único que este módulo necesita de Gmail. */
export type MessageTrasher = {
  trashMessage(id: string): Promise<void>;
};

export type TrashOutcome = {
  readonly trashed: readonly InboxMessage[];
  readonly failed: readonly InboxMessage[];
};

/**
 * Manda cada mensaje a la papelera. El fallo de uno no detiene a los demás: se reporta en `failed`
 * y se avisa por `onError`, para que el resumen diga la verdad de lo que pasó.
 */
export async function trashMessages(
  trasher: MessageTrasher,
  messages: readonly InboxMessage[],
  onError: (message: InboxMessage, error: unknown) => void,
): Promise<TrashOutcome> {
  const trashed: InboxMessage[] = [];
  const failed: InboxMessage[] = [];

  for (const message of messages) {
    try {
      await trasher.trashMessage(message.id);
      trashed.push(message);
    } catch (error) {
      failed.push(message);
      onError(message, error);
    }
  }

  return { trashed, failed };
}
