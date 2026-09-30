import { readFile } from "node:fs/promises";
import { parseSenderLists } from "./parseSenderLists.ts";
import { SenderListsError } from "./SenderListsError.ts";
import type { SenderLists } from "./types.ts";

export async function readSenderListsFile(path: URL): Promise<SenderLists> {
  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    throw new SenderListsError("No se pudo leer senders.json.", { cause: error });
  }

  try {
    return parseSenderLists(JSON.parse(contents));
  } catch (error) {
    if (error instanceof SenderListsError) {
      throw error;
    }
    throw new SenderListsError("senders.json no es JSON válido.", { cause: error });
  }
}
