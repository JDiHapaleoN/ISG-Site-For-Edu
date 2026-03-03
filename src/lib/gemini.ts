import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.OPENAI_API_KEY; // Reusing the same env variable for simplicity as per user request
const genAI = new GoogleGenerativeAI(apiKey || "");

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

export default genAI;
