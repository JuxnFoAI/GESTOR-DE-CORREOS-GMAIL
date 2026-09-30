import { describe, expect, it } from "vitest";
import { classifyMessages } from "./classifyMessages.ts";
import type { InboxMessage } from "./types.ts";

function inboxMessage(id: string, senderAddress: string | null): InboxMessage {
  return {
    id,
    senderAddress,
    senderLabel: senderAddress ?? "remitente desconocido",
    subject: "Asunto",
    receivedAt: null,
  };
}

const lists = {
  unwanted: ["no-reply@spotify.com"],
  important: ["team@hello.platzi.com"],
};

describe("classifyMessages", () => {
  it("puts a message from an unwanted sender in the unwanted list", () => {
    const messages = [inboxMessage("1", "no-reply@spotify.com")];

    expect(classifyMessages(messages, lists).unwanted).toHaveLength(1);
  });

  it("puts a message from an important sender in the important list", () => {
    const messages = [inboxMessage("1", "team@hello.platzi.com")];

    expect(classifyMessages(messages, lists).important).toHaveLength(1);
  });

  it("leaves an unlisted sender out of both lists", () => {
    const result = classifyMessages([inboxMessage("1", "amigo@gmail.com")], lists);

    expect([...result.unwanted, ...result.important]).toEqual([]);
  });

  it("leaves a message without a readable sender untouched", () => {
    const result = classifyMessages([inboxMessage("1", null)], lists);

    expect([...result.unwanted, ...result.important]).toEqual([]);
  });

  it("keeps the order in which the messages arrived", () => {
    const messages = [
      inboxMessage("1", "no-reply@spotify.com"),
      inboxMessage("2", "amigo@gmail.com"),
      inboxMessage("3", "no-reply@spotify.com"),
    ];

    expect(classifyMessages(messages, lists).unwanted.map((message) => message.id)).toEqual([
      "1",
      "3",
    ]);
  });

  it("returns empty lists when there are no messages", () => {
    expect(classifyMessages([], lists)).toEqual({ unwanted: [], important: [] });
  });

  it("returns empty lists when the sender lists are empty", () => {
    const result = classifyMessages([inboxMessage("1", "no-reply@spotify.com")], {
      unwanted: [],
      important: [],
    });

    expect(result.unwanted).toEqual([]);
  });
});
