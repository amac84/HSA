import { beforeEach, describe, expect, it } from "vitest";

import { enforceInMemoryRateLimit } from "@/lib/rate-limit";

describe("enforceInMemoryRateLimit", () => {
  beforeEach(() => {
    // Reset the shared in-memory store between tests.
    globalThis.__rateLimitStore = new Map();
  });

  it("allows requests under the limit", () => {
    const now = () => 1_000;
    const key = "unit:under";

    const first = enforceInMemoryRateLimit({ key, limit: 3, windowMs: 1000, now });
    const second = enforceInMemoryRateLimit({ key, limit: 3, windowMs: 1000, now });

    expect(first.ok).toBe(true);
    expect(first.remaining).toBe(2);
    expect(second.ok).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks requests once the limit is reached", () => {
    const now = () => 1_000;
    const key = "unit:block";

    enforceInMemoryRateLimit({ key, limit: 2, windowMs: 1000, now });
    enforceInMemoryRateLimit({ key, limit: 2, windowMs: 1000, now });
    const blocked = enforceInMemoryRateLimit({ key, limit: 2, windowMs: 1000, now });

    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = "unit:reset";
    let currentTime = 1_000;
    const now = () => currentTime;

    enforceInMemoryRateLimit({ key, limit: 1, windowMs: 1000, now });
    const blocked = enforceInMemoryRateLimit({ key, limit: 1, windowMs: 1000, now });
    expect(blocked.ok).toBe(false);

    // Advance beyond the window.
    currentTime = 2_500;
    const afterReset = enforceInMemoryRateLimit({ key, limit: 1, windowMs: 1000, now });

    expect(afterReset.ok).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });
});
