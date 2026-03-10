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
 * OpenAI Call helper for fallback
 */
async function fetchOpenAIFallback(prompt: string, timeoutMs: number) {
    if (!process.env.CHATGPT_API_KEY) {
        throw new Error("CHATGPT_API_KEY is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CHATGPT_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // fast and cost-effective
                messages: [{ role: "user", content: prompt }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} ${err?.error?.message || ''}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) throw new Error("Empty response from OpenAI");

        return {
            response: {
                text: () => text
            }
        };
    } catch (e: any) {
        clearTimeout(timeout);
        throw e;
    }
}

/**
 * Groq Call helper for fallback (Free & Fast)
 */
async function fetchGroqFallback(prompt: string, timeoutMs: number) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Powerful and free-tier available
                messages: [{ role: "user", content: prompt }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Groq API error: ${response.status} ${err?.error?.message || ''}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) throw new Error("Empty response from Groq");

        return {
            response: {
                text: () => text
            }
        };
    } catch (e: any) {
        clearTimeout(timeout);
        throw e;
    }
}

/**
 * Generate content with:
 * - Redis caching (24h)
 * - Model fallback chain
 * - OpenAI Fallback chain
 * - Groq Fallback chain (New)
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
        "gemini-2.0-flash", // stable flash
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
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
    // All Gemini models exhausted
    if (process.env.CHATGPT_API_KEY) {
        console.info(`[Gemini/OpenAI] All Gemini models failed. Falling back to OpenAI ChatGPT...`);
        try {
            const chatGptResult = await fetchOpenAIFallback(prompt, timeoutMs);
            const text = chatGptResult.response.text();

            if (text && text.trim().length >= 10) {
                await setCachedGeminiResponse(cacheKey, text, 86400); // 24h
                console.info(`[OpenAI Fallback] Success`);
                return chatGptResult;
            }
        } catch (openaiErr: any) {
            console.error(`[OpenAI Fallback Error] ${openaiErr.message}`);
        }
    }

    // OpenAI failed or not configured -> Try Groq (Free & Fast)
    if (process.env.GROQ_API_KEY) {
        console.info(`[Gemini/Groq] Falling back to Groq Free Cloud...`);
        try {
            const groqResult = await fetchGroqFallback(prompt, timeoutMs);
            const text = groqResult.response.text();

            if (text && text.trim().length >= 10) {
                await setCachedGeminiResponse(cacheKey, text, 86400); // 24h
                console.info(`[Groq Fallback] Success`);
                return groqResult;
            }
        } catch (groqErr: any) {
            console.error(`[Groq Fallback Error] ${groqErr.message}`);
        }
    }

    throw new GeminiError(
        `[Gemini] All models and fallbacks failed. Last error: ${lastError?.message}`,
        "ИИ временно недоступен. Попробуйте через несколько минут.",
        503
    );
}
