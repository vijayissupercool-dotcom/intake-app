import { describe, it, expect } from "vitest";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// The rate limiter uses a module-level Map. We need to clear it between tests.
// Since it's not exported, we test through the public API with unique keys.

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, { windowMs: 60_000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    checkRateLimit(key, { windowMs: 60_000, maxRequests: 3 });
    const second = checkRateLimit(key, { windowMs: 60_000, maxRequests: 3 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks when limit exceeded", () => {
    const key = `test-block-${Date.now()}`;
    const config = { windowMs: 60_000, maxRequests: 2 };
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const third = checkRateLimit(key, config);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("different keys are independent", () => {
    const base = Date.now();
    const config = { windowMs: 60_000, maxRequests: 1 };
    checkRateLimit(`key-a-${base}`, config);
    const result = checkRateLimit(`key-b-${base}`, config);
    expect(result.allowed).toBe(true);
  });

  it("returns resetAt in the future", () => {
    const key = `test-reset-${Date.now()}`;
    const result = checkRateLimit(key, { windowMs: 60_000, maxRequests: 10 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});

describe("getRateLimitHeaders", () => {
  it("returns remaining and reset headers when allowed", () => {
    const key = `test-headers-${Date.now()}`;
    const result = checkRateLimit(key, { windowMs: 60_000, maxRequests: 10 });
    const headers = getRateLimitHeaders(result);
    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("returns Retry-After when blocked", () => {
    const key = `test-retry-${Date.now()}`;
    const config = { windowMs: 60_000, maxRequests: 1 };
    checkRateLimit(key, config);
    const blocked = checkRateLimit(key, config);
    const headers = getRateLimitHeaders(blocked);
    expect(headers["Retry-After"]).toBeDefined();
    expect(Number(headers["Retry-After"])).toBeGreaterThan(0);
  });
});
