import { describe, expect, it } from "vitest";
import { appendRedirectTarget, sanitizeLocalRedirectTarget } from "./redirects";

describe("sanitizeLocalRedirectTarget", () => {
  it("accepts app-local routes and preserves their query string", () => {
    expect(sanitizeLocalRedirectTarget("/join/abc123def456ghi789")).toBe("/join/abc123def456ghi789");
    expect(sanitizeLocalRedirectTarget("/join/abc123def456ghi789?step=confirm")).toBe(
      "/join/abc123def456ghi789?step=confirm",
    );
  });

  it("rejects external, malformed, and protocol-relative redirect targets", () => {
    expect(sanitizeLocalRedirectTarget("https://example.com/join/abc")).toBeNull();
    expect(sanitizeLocalRedirectTarget("//example.com/join/abc")).toBeNull();
    expect(sanitizeLocalRedirectTarget("join/abc")).toBeNull();
  });
});

describe("appendRedirectTarget", () => {
  it("adds redirectTo only when a safe target is present", () => {
    expect(appendRedirectTarget("/auth/signin", "/join/abc123def456ghi789")).toBe(
      "/auth/signin?redirectTo=%2Fjoin%2Fabc123def456ghi789",
    );
    expect(appendRedirectTarget("/auth/signup?source=invite", "/join/abc123def456ghi789")).toBe(
      "/auth/signup?source=invite&redirectTo=%2Fjoin%2Fabc123def456ghi789",
    );
    expect(appendRedirectTarget("/auth/signin", null)).toBe("/auth/signin");
  });
});
