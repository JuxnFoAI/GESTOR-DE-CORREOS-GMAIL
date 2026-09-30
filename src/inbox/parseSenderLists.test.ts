import { describe, expect, it } from "vitest";
import { parseSenderLists } from "./parseSenderLists.ts";
import { SenderListsError } from "./SenderListsError.ts";

describe("parseSenderLists", () => {
  it("reads both lists", () => {
    const lists = parseSenderLists({
      unwanted: ["no-reply@spotify.com"],
      important: ["team@hello.platzi.com"],
    });

    expect(lists).toEqual({
      unwanted: ["no-reply@spotify.com"],
      important: ["team@hello.platzi.com"],
    });
  });

  it("normalizes addresses to lowercase without spaces", () => {
    const lists = parseSenderLists({ unwanted: ["  No-Reply@Spotify.com "], important: [] });

    expect(lists.unwanted).toEqual(["no-reply@spotify.com"]);
  });

  it("removes duplicated addresses", () => {
    const lists = parseSenderLists({
      unwanted: ["no-reply@spotify.com", "NO-REPLY@spotify.com"],
      important: [],
    });

    expect(lists.unwanted).toEqual(["no-reply@spotify.com"]);
  });

  it("accepts empty lists", () => {
    expect(parseSenderLists({ unwanted: [], important: [] })).toEqual({
      unwanted: [],
      important: [],
    });
  });

  it("rejects an address that appears in both lists", () => {
    expect(() =>
      parseSenderLists({ unwanted: ["a@b.com"], important: ["a@b.com"] }),
    ).toThrow(/están en las dos listas/);
  });

  it("rejects a list that is not an array", () => {
    expect(() => parseSenderLists({ unwanted: "a@b.com", important: [] })).toThrow(
      /unwanted.*arreglo/,
    );
  });

  it("rejects an entry that is not a valid address", () => {
    expect(() => parseSenderLists({ unwanted: ["spotify"], important: [] })).toThrow(
      SenderListsError,
    );
  });

  it("rejects an entry that is not a string", () => {
    expect(() => parseSenderLists({ unwanted: [42], important: [] })).toThrow(SenderListsError);
  });

  it("rejects a payload that is not an object", () => {
    expect(() => parseSenderLists([])).toThrow(/debe contener un objeto/);
  });

  it("names the missing list when a key is absent", () => {
    expect(() => parseSenderLists({ unwanted: [] })).toThrow(/important/);
  });
});
