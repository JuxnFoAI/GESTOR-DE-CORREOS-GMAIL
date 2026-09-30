import { describe, expect, it } from "vitest";
import { toInboxMessage } from "./toInboxMessage.ts";

const gmailMessage = {
  id: "18f0",
  from: "Spotify <no-reply@spotify.com>",
  subject: "Tu resumen semanal",
  receivedAt: new Date(1_759_190_400_000),
};

describe("toInboxMessage", () => {
  it("reduces the From header to a comparable address", () => {
    expect(toInboxMessage(gmailMessage).senderAddress).toBe("no-reply@spotify.com");
  });

  it("labels the sender with the address, not with the display name", () => {
    expect(toInboxMessage(gmailMessage).senderLabel).toBe("no-reply@spotify.com");
  });

  it("falls back to the raw header when there is no readable address", () => {
    const message = toInboxMessage({ ...gmailMessage, from: "Correo interno" });

    expect(message).toMatchObject({ senderAddress: null, senderLabel: "Correo interno" });
  });

  it("labels an empty sender as unknown", () => {
    expect(toInboxMessage({ ...gmailMessage, from: "  " }).senderLabel).toBe(
      "remitente desconocido",
    );
  });

  it("labels an empty subject", () => {
    expect(toInboxMessage({ ...gmailMessage, subject: "" }).subject).toBe("(sin asunto)");
  });

  it("keeps the id and the date", () => {
    expect(toInboxMessage(gmailMessage)).toMatchObject({
      id: "18f0",
      receivedAt: new Date(1_759_190_400_000),
    });
  });
});
