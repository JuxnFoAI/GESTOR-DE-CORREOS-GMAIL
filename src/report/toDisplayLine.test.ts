import { describe, expect, it } from "vitest";
import { toDisplayLine } from "./toDisplayLine.ts";

describe("toDisplayLine", () => {
  it("leaves a normal subject as it is", () => {
    expect(toDisplayLine("Tu resumen semanal")).toBe("Tu resumen semanal");
  });

  it("collapses line breaks into single spaces", () => {
    expect(toDisplayLine("Primera\r\nSegunda")).toBe("Primera Segunda");
  });

  it("collapses tabs and repeated spaces", () => {
    expect(toDisplayLine("Hola\t\t  mundo")).toBe("Hola mundo");
  });

  it("trims the edges", () => {
    expect(toDisplayLine("  Hola  ")).toBe("Hola");
  });

  it("truncates a long subject to 120 characters", () => {
    expect(toDisplayLine("a".repeat(500))).toHaveLength(120);
  });

  it("marks a truncated subject with an ellipsis", () => {
    expect(toDisplayLine("a".repeat(500)).endsWith("…")).toBe(true);
  });

  it("returns an empty string for a blank value", () => {
    expect(toDisplayLine("   \n  ")).toBe("");
  });
});
