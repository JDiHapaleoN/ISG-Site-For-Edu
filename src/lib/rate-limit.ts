/**
 * In-memory sliding window rate limiter.
 * Works on Vercel Edge/Serverless without external dependencies.
 * 
 * Note: In serverless environments, state resets per cold start.
 * For production-grade limiting, use Redis (Upstash) when available.
 */

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const cutoff = now - windowMs * 2; // Keep 2x window for safety
    for (const [key, entry] of store) {
        if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
            store.delete(key);
        }
    }
}

interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetMs: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * 
 * @param identifier - Unique key (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    cleanup(config.windowMs);

    let entry = store.get(identifier);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    if (entry.timestamps.length >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        const resetMs = oldestInWindow + config.windowMs - now;
        return {
            allowed: false,
            remaining: 0,
            resetMs: Math.max(0, resetMs),
        };
    }

    entry.timestamps.push(now);
    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetMs: config.windowMs,
    };
}

// ─── Preset Configurations ───

/** AI endpoints: 5 requests per minute */
export const AI_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 60_000,
};

/** Login: 10 requests per minute */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60_000,
};

/** Word creation: 30 requests per minute */
export const WORD_CREATION_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 30,
    windowMs: 60_000,
};

/** General API: 60 requests per minute */
export const GENERAL_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60_000,
};

/**
 * Helper to extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(req: Request): string {
    const headers = new Headers(req.headers);
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "anonymous"
    );
}
