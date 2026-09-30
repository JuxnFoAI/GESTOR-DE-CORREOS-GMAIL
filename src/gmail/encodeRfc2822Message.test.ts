import { describe, expect, it } from "vitest";
import { encodeRfc2822Message } from "./encodeRfc2822Message.ts";

const email = {
  to: "yo@gmail.com",
  subject: "Limpieza de Gmail",
  body: "Todo en orden.",
};

function decode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

describe("encodeRfc2822Message", () => {
  it("writes the recipient in the To header", () => {
    expect(decode(encodeRfc2822Message(email))).toContain("To: yo@gmail.com");
  });

  it("encodes the subject as RFC 2047 so accents survive", () => {
    const raw = decode(encodeRfc2822Message({ ...email, subject: "Revisión" }));

    expect(raw).toContain(`Subject: =?UTF-8?B?${Buffer.from("Revisión").toString("base64")}?=`);
  });

  it("separates the headers from the body with an empty line", () => {
    expect(decode(encodeRfc2822Message(email))).toContain(
      "Content-Transfer-Encoding: base64\r\n\r\n",
    );
  });

  it("encodes the body in base64", () => {
    const raw = decode(encodeRfc2822Message(email));

    expect(raw.split("\r\n\r\n")[1]).toBe(Buffer.from("Todo en orden.").toString("base64"));
  });

  it("keeps a multiline body inside the body, not in the headers", () => {
    const raw = decode(encodeRfc2822Message({ ...email, body: "Primera\nSegunda" }));

    expect(raw.split("\r\n\r\n")[0]).not.toContain("Segunda");
  });

  it("rejects a recipient with a line break", () => {
    expect(() => encodeRfc2822Message({ ...email, to: "yo@gmail.com\r\nBcc: otro@gmail.com" })).toThrow(
      TypeError,
    );
  });

  it("rejects a subject with a line break", () => {
    expect(() => encodeRfc2822Message({ ...email, subject: "Hola\nAdiós" })).toThrow(TypeError);
  });
});
