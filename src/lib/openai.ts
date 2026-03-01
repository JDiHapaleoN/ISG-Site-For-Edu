import OpenAI from "openai";

// Make sure to populate OPENAI_API_KEY in your .env.local
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
