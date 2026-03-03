import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.OPENAI_API_KEY) {
    console.warn("Missing OPENAI_API_KEY environment variable. Gemini AI features will not work.");
}

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-pro",
});

export default genAI;
