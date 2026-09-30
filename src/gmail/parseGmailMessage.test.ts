import { describe, expect, it } from "vitest";
import { parseGmailMessage } from "./parseGmailMessage.ts";

function gmailPayload(headers: { name: string; value: string }[], internalDate = "1759190400000") {
  return { id: "18f0", internalDate, payload: { headers } };
}

describe("parseGmailMessage", () => {
  it("reads the sender, the subject and the date", () => {
    const message = parseGmailMessage(
      gmailPayload([
        { name: "From", value: "Spotify <no-reply@spotify.com>" },
        { name: "Subject", value: "Tu resumen semanal" },
      ]),
    );

    expect(message).toEqual({
      id: "18f0",
      from: "Spotify <no-reply@spotify.com>",
      subject: "Tu resumen semanal",
      receivedAt: new Date(1_759_190_400_000),
    });
  });

  it("matches header names regardless of their case", () => {
    const message = parseGmailMessage(gmailPayload([{ name: "FROM", value: "a@b.com" }]));

    expect(message?.from).toBe("a@b.com");
  });

  it("returns empty strings when the headers are missing", () => {
    const message = parseGmailMessage({ id: "18f0", payload: {} });

    expect(message).toMatchObject({ from: "", subject: "" });
  });

  it("returns null when the payload has no id", () => {
    expect(parseGmailMessage({ payload: { headers: [] } })).toBeNull();
  });

  it("returns null when the payload is not an object", () => {
    expect(parseGmailMessage("18f0")).toBeNull();
  });

  it("ignores headers that are not name and value pairs", () => {
    const message = parseGmailMessage({
      id: "18f0",
      payload: { headers: ["From: a@b.com", { name: "From" }, { value: "a@b.com" }] },
    });

    expect(message?.from).toBe("");
  });

  it("leaves receivedAt null when internalDate is not a number", () => {
    const message = parseGmailMessage(gmailPayload([], "ayer"));

    expect(message?.receivedAt).toBeNull();
  });
});
