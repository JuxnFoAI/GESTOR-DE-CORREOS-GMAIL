import { describe, expect, it } from "vitest";
import { formatReportTimestamp } from "./formatReportTimestamp.ts";

describe("formatReportTimestamp", () => {
  it("formats the instant in Bogota time", () => {
    expect(formatReportTimestamp(new Date("2026-09-29T20:00:00Z"))).toBe("29/09/2026 15:00");
  });

  it("uses a 24 hour clock", () => {
    expect(formatReportTimestamp(new Date("2026-09-29T23:30:00Z"))).toBe("29/09/2026 18:30");
  });

  it("shows midnight as 00", () => {
    expect(formatReportTimestamp(new Date("2026-09-29T05:00:00Z"))).toBe("29/09/2026 00:00");
  });

  it("pads single digit days and months", () => {
    expect(formatReportTimestamp(new Date("2026-01-05T15:00:00Z"))).toBe("05/01/2026 10:00");
  });
});
