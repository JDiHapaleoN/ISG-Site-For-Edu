import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Caching is disabled.");
}

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Cache helper for Gemini responses.
 * Uses a hashed key of the prompt and config.
 */
export async function getCachedGeminiResponse(key: string): Promise<any | null> {
    try {
        const cached = await redis.get(`gemini:${key}`);
        if (cached) {
            console.info(`[Redis] Cache hit for gemini:${key}`);
            return cached;
        }
    } catch (error) {
        console.error("[Redis] Cache get error:", error);
    }
    return null;
}

export async function setCachedGeminiResponse(key: string, value: any, ttl = 86400): Promise<void> {
    try {
        await redis.set(`gemini:${key}`, value, { ex: ttl });
        console.info(`[Redis] Cache set for gemini:${key} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error("[Redis] Cache set error:", error);
    }
}

/**
 * Cache helper for deck metadata.
 */
export async function getCachedDeckMetadata(userId: string, module: string): Promise<any | null> {
    try {
        return await redis.get(`deck:${userId}:${module}`);
    } catch (error) {
        console.error("[Redis] Deck cache get error:", error);
        return null;
    }
}

export async function setCachedDeckMetadata(userId: string, module: string, value: any): Promise<void> {
    try {
        await redis.set(`deck:${userId}:${module}`, value, { ex: 300 }); // 5 min TTL
    } catch (error) {
        console.error("[Redis] Deck cache set error:", error);
    }
}

export async function invalidateDeckMetadata(userId: string, module: string): Promise<void> {
    try {
        await redis.del(`deck:${userId}:${module}`);
        console.info(`[Redis] Cache invalidated for deck:${userId}:${module}`);
    } catch (error) {
        console.error("[Redis] Cache invalidate error:", error);
    }
}
