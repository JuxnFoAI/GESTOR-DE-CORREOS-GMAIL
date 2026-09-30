import { describe, expect, it } from "vitest";
import { ConfigError, readConfig } from "./config.ts";

const validEnv = {
  GMAIL_CLIENT_ID: "cliente",
  GMAIL_CLIENT_SECRET: "secreto",
  GMAIL_REFRESH_TOKEN: "refresh",
};

describe("readConfig", () => {
  it("reads the three credentials from the environment", () => {
    expect(readConfig(validEnv).credentials).toEqual({
      clientId: "cliente",
      clientSecret: "secreto",
      refreshToken: "refresh",
    });
  });

  it("throws ConfigError naming the missing variable", () => {
    expect(() => readConfig({ ...validEnv, GMAIL_REFRESH_TOKEN: undefined })).toThrow(
      /GMAIL_REFRESH_TOKEN/,
    );
  });

  it("treats a blank credential as missing", () => {
    expect(() => readConfig({ ...validEnv, GMAIL_CLIENT_ID: "   " })).toThrow(ConfigError);
  });

  it("defaults lookbackHours to 6 when the variable is absent", () => {
    expect(readConfig(validEnv).lookbackHours).toBe(6);
  });

  it("defaults lookbackHours to 6 when the variable is empty", () => {
    expect(readConfig({ ...validEnv, LOOKBACK_HOURS: "" }).lookbackHours).toBe(6);
  });

  it("reads lookbackHours when it is a valid integer", () => {
    expect(readConfig({ ...validEnv, LOOKBACK_HOURS: "12" }).lookbackHours).toBe(12);
  });

  it("rejects a lookbackHours outside the allowed range", () => {
    expect(() => readConfig({ ...validEnv, LOOKBACK_HOURS: "0" })).toThrow(ConfigError);
  });

  it("rejects a lookbackHours that is not a number", () => {
    expect(() => readConfig({ ...validEnv, LOOKBACK_HOURS: "seis" })).toThrow(ConfigError);
  });

  it("enables dry run only for the exact value true", () => {
    expect(readConfig({ ...validEnv, DRY_RUN: "true" }).isDryRun).toBe(true);
  });

  it("keeps dry run off for any other value", () => {
    expect(readConfig({ ...validEnv, DRY_RUN: "1" }).isDryRun).toBe(false);
  });
});
