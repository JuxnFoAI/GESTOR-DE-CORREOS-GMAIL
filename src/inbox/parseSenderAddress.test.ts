import { describe, expect, it } from "vitest";
import { isEmailAddress, parseSenderAddress } from "./parseSenderAddress.ts";

describe("parseSenderAddress", () => {
  it("reads a bare address", () => {
    expect(parseSenderAddress("no-reply@spotify.com")).toBe("no-reply@spotify.com");
  });

  it("reads the address inside angle brackets", () => {
    expect(parseSenderAddress("Spotify <no-reply@spotify.com>")).toBe("no-reply@spotify.com");
  });

  it("lowercases the address so the comparison is case insensitive", () => {
    expect(parseSenderAddress("No-Reply@Spotify.com")).toBe("no-reply@spotify.com");
  });

  it("ignores a display name that contains an at sign", () => {
    expect(parseSenderAddress('"correo@falso" <real@spotify.com>')).toBe("real@spotify.com");
  });

  it("trims surrounding whitespace", () => {
    expect(parseSenderAddress("  no-reply@spotify.com  ")).toBe("no-reply@spotify.com");
  });

  it("returns null for an empty header", () => {
    expect(parseSenderAddress("")).toBeNull();
  });

  it("returns null when there is no address", () => {
    expect(parseSenderAddress("Remitente desconocido")).toBeNull();
  });

  it("returns null when the domain has no dot", () => {
    expect(parseSenderAddress("alguien@localhost")).toBeNull();
  });
});

describe("isEmailAddress", () => {
  it("accepts a plain address", () => {
    expect(isEmailAddress("a@b.com")).toBe(true);
  });

  it("rejects an address with spaces", () => {
    expect(isEmailAddress("a @b.com")).toBe(false);
  });

  it("rejects an address with two at signs", () => {
    expect(isEmailAddress("a@b@c.com")).toBe(false);
  });
});
