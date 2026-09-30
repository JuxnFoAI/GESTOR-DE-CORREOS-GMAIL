import type { Classification, InboxMessage, SenderLists } from "./types.ts";

/**
 * Reparte los mensajes según las listas de remitentes. Lo que no está en ninguna lista se queda
 * en la bandeja sin tocar, que es el comportamiento seguro por defecto.
 */
export function classifyMessages(
  messages: readonly InboxMessage[],
  lists: SenderLists,
): Classification {
  const unwanted = new Set(lists.unwanted);
  const important = new Set(lists.important);

  return {
    unwanted: messages.filter((message) => isFrom(message, unwanted)),
    important: messages.filter((message) => isFrom(message, important)),
  };
}

function isFrom(message: InboxMessage, addresses: ReadonlySet<string>): boolean {
  return message.senderAddress !== null && addresses.has(message.senderAddress);
}
