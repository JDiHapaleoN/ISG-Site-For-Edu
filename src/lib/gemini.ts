import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCachedGeminiResponse, setCachedGeminiResponse } from "./redis";
import * as crypto from "crypto";

if (!process.env.OPENAI_API_KEY) {
    console.warn("[Gemini] Missing OPENAI_API_KEY. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

/** Custom error class with user-facing message */
export class GeminiError extends Error {
    public readonly userMessage: string;
    public readonly statusCode: number;

    constructor(message: string, userMessage: string, statusCode = 500) {
        super(message);
        this.name = "GeminiError";
        this.userMessage = userMessage;
        this.statusCode = statusCode;
    }
}

/** Sleep helper for backoff */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate content with:
 * - Redis caching (24h)
 * - Model fallback chain
 * - 30s AbortController timeout per attempt
 * - Exponential backoff on 429 (rate limit)
 * - Response validation
 */
export async function generateContentWithFallback(
    prompt: string,
    config: any = {},
    timeoutMs = 30000
) {
    // 1. Generate cache key from prompt and config
    const cacheKey = crypto
        .createHash("sha256")
        .update(prompt + JSON.stringify(config))
        .digest("hex");

    // 2. Check cache
    const cached = await getCachedGeminiResponse(cacheKey);
    if (cached) {
        return {
            response: {
                text: () => cached,
            },
            isCached: true,
        };
    }

    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        // Retry loop per model (for 429 backoff)
        for (let attempt = 0; attempt < 3; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: config,
                });

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                });

                clearTimeout(timeout);

                // Validate response
                const text = result.response?.text?.();
                if (!text || text.trim().length < 10) {
                    throw new GeminiError(
                        `[Gemini] Empty response from ${modelName}`,
                        "ИИ вернул пустой ответ. Попробуйте ещё раз.",
                        502
                    );
                }

                // 3. Store in cache on success
                await setCachedGeminiResponse(cacheKey, text, 86400); // 24h

                console.info(`[Gemini] Success with ${modelName} on attempt ${attempt + 1}`);
                return result;
            } catch (error: any) {
                clearTimeout(timeout);
                lastError = error;

                // Abort → timeout
                if (error.name === "AbortError" || controller.signal.aborted) {
                    console.warn(`[Gemini] Timeout (${timeoutMs}ms) on ${modelName}, attempt ${attempt + 1}`);
                    continue; // Retry same model
                }

                // 429 rate limit → exponential backoff
                if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("rate")) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
                    console.warn(`[Gemini] Rate limited on ${modelName}, backing off ${backoffMs}ms (attempt ${attempt + 1})`);
                    await sleep(backoffMs);
                    continue; // Retry same model
                }

                // 404 / unsupported model → try next model
                if (
                    error.message?.includes("404") ||
                    error.message?.includes("is not supported") ||
                    error.message?.includes("not found")
                ) {
                    console.warn(`[Gemini] Model ${modelName} not available, trying next`);
                    break; // Break retry loop, go to next model
                }

                // 403 invalid key → fatal, don't retry
                if (error.message?.includes("403") || error.message?.includes("API key")) {
                    throw new GeminiError(
                        `[Gemini] Invalid API key: ${error.message}`,
                        "Ошибка ключа API. Свяжитесь с администратором.",
                        403
                    );
                }

                // Unknown error → try next model
                console.error(`[Gemini] Unexpected error on ${modelName}: ${error.message}`);
                break;
            }
        }
    }

    // All models exhausted
    throw new GeminiError(
        `[Gemini] All models failed. Last error: ${lastError?.message}`,
        "ИИ временно недоступен. Попробуйте через несколько минут.",
        503
    );
}
