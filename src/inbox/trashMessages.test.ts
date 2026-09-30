import { describe, expect, it, vi } from "vitest";
import { trashMessages } from "./trashMessages.ts";
import type { InboxMessage } from "./types.ts";

type TrashMessage = (id: string) => Promise<void>;
type OnError = (message: InboxMessage, error: unknown) => void;

function inboxMessage(id: string): InboxMessage {
  return {
    id,
    senderAddress: "no-reply@spotify.com",
    senderLabel: "no-reply@spotify.com",
    subject: "Asunto",
    receivedAt: null,
  };
}

describe("trashMessages", () => {
  it("trashes every message when Gmail responds", async () => {
    const trasher = { trashMessage: vi.fn<TrashMessage>(async () => {}) };

    const outcome = await trashMessages(trasher, [inboxMessage("1"), inboxMessage("2")], () => {});

    expect(outcome.trashed.map((message) => message.id)).toEqual(["1", "2"]);
  });

  it("keeps going when one message fails", async () => {
    const trasher = {
      trashMessage: vi.fn<TrashMessage>(async (id) => {
        if (id === "1") {
          throw new Error("HTTP 404");
        }
      }),
    };

    const outcome = await trashMessages(trasher, [inboxMessage("1"), inboxMessage("2")], () => {});

    expect(outcome).toMatchObject({
      trashed: [expect.objectContaining({ id: "2" })],
      failed: [expect.objectContaining({ id: "1" })],
    });
  });

  it("reports each failure through onError", async () => {
    const error = new Error("HTTP 404");
    const trasher = {
      trashMessage: async () => {
        throw error;
      },
    };
    const onError = vi.fn<OnError>();

    await trashMessages(trasher, [inboxMessage("1")], onError);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }), error);
  });

  it("does not call Gmail when there is nothing to trash", async () => {
    const trasher = { trashMessage: vi.fn<TrashMessage>(async () => {}) };

    const outcome = await trashMessages(trasher, [], () => {});

    expect(trasher.trashMessage).not.toHaveBeenCalled();
    expect(outcome).toEqual({ trashed: [], failed: [] });
  });
});
