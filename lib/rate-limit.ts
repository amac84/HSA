import { NextResponse } from "next/server";

import {
  RATE_LIMIT_ENABLED,
  RATE_LIMIT_REDIS_TOKEN,
  RATE_LIMIT_REDIS_URL,
} from "@/lib/config";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
};

export type EnforceRateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  /** Injectable clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __rateLimitStore: Map<string, Bucket> | undefined;
}

function getStore(): Map<string, Bucket> {
  if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = new Map();
  }
  return globalThis.__rateLimitStore;
}

/**
 * Fixed-window in-memory limiter. Suitable for single-instance / dev use.
 * Exposed separately so it can be unit-tested with an injected clock.
 */
export function enforceInMemoryRateLimit(options: EnforceRateLimitOptions): RateLimitResult {
  const now = (options.now ?? Date.now)();
  const store = getStore();
  const existing = store.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(options.key, { count: 1, resetAt });
    return {
      ok: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetMs: resetAt - now,
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      limit: options.limit,
      remaining: 0,
      resetMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  store.set(options.key, existing);

  return {
    ok: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetMs: existing.resetAt - now,
  };
}

type UpstashLimiter = {
  limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }>;
};

const upstashLimiterCache = new Map<string, UpstashLimiter>();

async function getUpstashLimiter(limit: number, windowMs: number): Promise<UpstashLimiter | null> {
  if (!RATE_LIMIT_REDIS_URL || !RATE_LIMIT_REDIS_TOKEN) {
    return null;
  }

  const cacheKey = `${limit}:${windowMs}`;
  const cached = upstashLimiterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);

    const redis = new Redis({
      url: RATE_LIMIT_REDIS_URL,
      token: RATE_LIMIT_REDIS_TOKEN,
    });

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "hsa-rl",
    });

    upstashLimiterCache.set(cacheKey, limiter);
    return limiter;
  } catch (error) {
    console.error("Failed to initialize Upstash rate limiter; falling back to in-memory.", error);
    return null;
  }
}

/**
 * Enforces a rate limit for the given key. Uses Upstash Redis when configured,
 * otherwise an in-memory fixed-window limiter. Returns an "ok" result when
 * rate limiting is disabled via env.
 */
export async function enforceRateLimit(options: EnforceRateLimitOptions): Promise<RateLimitResult> {
  if (!RATE_LIMIT_ENABLED) {
    return { ok: true, limit: options.limit, remaining: options.limit, resetMs: 0 };
  }

  const upstash = await getUpstashLimiter(options.limit, options.windowMs);
  if (upstash) {
    const result = await upstash.limit(options.key);
    return {
      ok: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetMs: Math.max(0, result.reset - Date.now()),
    };
  }

  return enforceInMemoryRateLimit(options);
}

/** Builds a 429 JSON response with standard rate-limit headers. */
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil(result.resetMs / 1000));

  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
      },
    },
  );
}

/** Derives a best-effort client IP for anonymous rate limiting fallback. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
