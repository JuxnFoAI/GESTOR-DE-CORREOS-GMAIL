import { describe, expect, it, vi } from "vitest";
import type { FetchLike } from "../lib/FetchLike.ts";
import { GmailClient } from "./GmailClient.ts";

const ACCESS_TOKEN = "ya29.token";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function messagePayload(id: string, from: string, subject: string) {
  return {
    id,
    internalDate: "1759190400000",
    payload: { headers: [{ name: "From", value: from }, { name: "Subject", value: subject }] },
  };
}

/** Cliente con un `fetch` falso que responde según el trozo de ruta pedido y sin esperas reales. */
function clientWith(routes: Record<string, () => Response>) {
  const fetchImpl = vi.fn<FetchLike>(async (url) => {
    const route = Object.entries(routes).find(([path]) => url.includes(path));
    if (route === undefined) {
      throw new Error(`Ruta no esperada: ${url}`);
    }
    return route[1]();
  });
  const client = new GmailClient(ACCESS_TOKEN, { fetch: fetchImpl, sleep: async () => {} });
  return { client, fetchImpl };
}

describe("GmailClient", () => {
  it("reads the address of the connected account", async () => {
    const { client } = clientWith({ "/profile": () => jsonResponse({ emailAddress: "yo@gmail.com" }) });

    await expect(client.readOwnAddress()).resolves.toBe("yo@gmail.com");
  });

  it("throws when the profile has no address", async () => {
    const { client } = clientWith({ "/profile": () => jsonResponse({}) });

    await expect(client.readOwnAddress()).rejects.toThrow(/dirección de la cuenta/);
  });

  it("sends the access token as a bearer header", async () => {
    const { client, fetchImpl } = clientWith({
      "/profile": () => jsonResponse({ emailAddress: "yo@gmail.com" }),
    });

    await client.readOwnAddress();

    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("asks only for inbox messages received after the given date", async () => {
    const { client, fetchImpl } = clientWith({ "/messages?": () => jsonResponse({}) });

    await client.listInboxMessagesSince(new Date("2026-09-29T20:00:00Z"));

    expect(fetchImpl.mock.calls[0]?.[0]).toContain("q=in%3Ainbox+after%3A1790712000");
  });

  it("normalizes every listed message", async () => {
    const { client } = clientWith({
      "/messages?": () => jsonResponse({ messages: [{ id: "18f0" }] }),
      "/messages/18f0": () => jsonResponse(messagePayload("18f0", "a@b.com", "Hola")),
    });

    await expect(client.listInboxMessagesSince(new Date(0))).resolves.toEqual([
      { id: "18f0", from: "a@b.com", subject: "Hola", receivedAt: new Date(1_759_190_400_000) },
    ]);
  });

  it("returns an empty list when the inbox has nothing new", async () => {
    const { client } = clientWith({ "/messages?": () => jsonResponse({ resultSizeEstimate: 0 }) });

    await expect(client.listInboxMessagesSince(new Date(0))).resolves.toEqual([]);
  });

  it("throws when the message list is not an array", async () => {
    const { client } = clientWith({ "/messages?": () => jsonResponse({ messages: "18f0" }) });

    await expect(client.listInboxMessagesSince(new Date(0))).rejects.toThrow(
      /lista de mensajes inesperada/,
    );
  });

  it("moves a message to the trash endpoint", async () => {
    const { client, fetchImpl } = clientWith({ "/trash": () => new Response(null, { status: 204 }) });

    await client.trashMessage("18f0");

    expect(fetchImpl.mock.calls[0]?.[0]).toMatch(/\/messages\/18f0\/trash$/);
    expect(fetchImpl.mock.calls[0]?.[1]?.method).toBe("POST");
  });

  it("escapes the message id in the URL", async () => {
    const { client, fetchImpl } = clientWith({ "/trash": () => new Response(null, { status: 204 }) });

    await client.trashMessage("18f0/../otro");

    expect(fetchImpl.mock.calls[0]?.[0]).toContain("18f0%2F..%2Fotro");
  });

  it("sends the summary as a base64url raw message", async () => {
    const { client, fetchImpl } = clientWith({ "/messages/send": () => jsonResponse({ id: "18f1" }) });

    await client.sendEmail({ to: "yo@gmail.com", subject: "Limpieza", body: "Hecho." });

    const body: unknown = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({ raw: expect.stringMatching(/^[\w-]+$/) });
  });

  it("retries when Gmail answers 503 and then succeeds", async () => {
    let attempts = 0;
    const { client } = clientWith({
      "/profile": () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ error: "unavailable" }, 503)
          : jsonResponse({ emailAddress: "yo@gmail.com" });
      },
    });

    await expect(client.readOwnAddress()).resolves.toBe("yo@gmail.com");
    expect(attempts).toBe(2);
  });

  it("does not retry when the token is rejected", async () => {
    let attempts = 0;
    const { client } = clientWith({
      "/profile": () => {
        attempts += 1;
        return jsonResponse({ error: "unauthorized" }, 401);
      },
    });

    await expect(client.readOwnAddress()).rejects.toMatchObject({ status: 401 });
    expect(attempts).toBe(1);
  });
});
