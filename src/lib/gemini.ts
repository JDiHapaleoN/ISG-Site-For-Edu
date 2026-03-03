import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.OPENAI_API_KEY) {
    console.warn("Missing OPENAI_API_KEY environment variable. Gemini AI features will not work.");
}

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export async function generateContentWithFallback(prompt: string, config: any = {}) {
    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName, generationConfig: config });
            const result = await model.generateContent(prompt);
            return result;
        } catch (error: any) {
            lastError = error;
            console.warn(`[Gemini Fallback] Model ${modelName} failed: ${error.message}`);

            // If it's a 404 or unsupported method, try the next model
            if (error.message?.includes("404") || error.message?.includes("is not supported") || error.message?.includes("not found")) {
                continue;
            }

            // If it's a real error (403 invalid key, 429 quota, etc.), throw immediately
            throw error;
        }
    }

    throw lastError;
}
