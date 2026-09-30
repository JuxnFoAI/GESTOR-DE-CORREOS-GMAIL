import { asRecord } from "../lib/asRecord.ts";
import { isEmailAddress } from "./parseSenderAddress.ts";
import { SenderListsError } from "./SenderListsError.ts";
import type { SenderLists } from "./types.ts";

/**
 * Valida el contenido de `senders.json`. Falla pronto y con un mensaje concreto, porque una lista
 * mal escrita se traduce en correos borrados por error.
 *
 * Invariantes: direcciones con formato válido, sin repetidos y ninguna en las dos listas a la vez.
 */
export function parseSenderLists(raw: unknown): SenderLists {
  const lists = asRecord(raw);
  if (lists === null) {
    throw new SenderListsError("senders.json debe contener un objeto.");
  }

  const unwanted = readAddressList(lists.unwanted, "unwanted");
  const important = readAddressList(lists.important, "important");

  const inBothLists = unwanted.filter((address) => important.includes(address));
  if (inBothLists.length > 0) {
    throw new SenderListsError(
      `Estas direcciones están en las dos listas: ${inBothLists.join(", ")}.`,
    );
  }

  return { unwanted, important };
}

function readAddressList(raw: unknown, listName: string): string[] {
  if (!Array.isArray(raw)) {
    throw new SenderListsError(`La lista ${listName} de senders.json debe ser un arreglo.`);
  }

  const addresses: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string" || !isEmailAddress(entry.trim().toLowerCase())) {
      throw new SenderListsError(
        `La lista ${listName} tiene una dirección inválida: ${JSON.stringify(entry)}.`,
      );
    }
    const address = entry.trim().toLowerCase();
    if (!addresses.includes(address)) {
      addresses.push(address);
    }
  }
  return addresses;
}
