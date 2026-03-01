import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { word, context, module } = await req.json();

    if (!word || !module) {
      return NextResponse.json({ error: "Missing word or module" }, { status: 400 });
    }

    if (module !== "english" && module !== "german") {
      return NextResponse.json({ error: "Invalid module. Use 'english' or 'german'." }, { status: 400 });
    }

    const isGerman = module === "german";

    // System prompt enforces mapping to Russian and extracting specific properties based on language
    const prompt = `
You are a linguistic expert assisting a native Russian speaker studying ${isGerman ? "German" : "English"} at an advanced level.
Analyze the provided word in the given context. 

Word: "${word}"
Context: "${context}"

Extract and return exactly the following JSON structure:
{
  "term": "The base lemma or infinitive form of the word",
  "translation": "Direct translation into Russian",
  "contextTranslation": "Translation of the provided context sentence into Russian",
  "mnemonic": "A short, memorable Russian mnemonic or association to remember this word",
  "partOfSpeech": "noun, verb, adjective, etc."
  ${isGerman
        ? ',\n  "article": "For nouns only: der, die, or das. Empty string otherwise.",\n  "pluralForm": "For nouns only: the plural suffix or form, e.g., -en, -e,  ̈-e. Empty string otherwise."'
        : ',\n  "transcription": "IPA phonetic transcription of the word"'}
}
Return only JSON.
`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Gemini Response:", responseText);

    if (!responseText) throw new Error("No response from Gemini");

    // Clean response from markdown backticks if present
    const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    const translationData = JSON.parse(cleanJson);

    // Check if word already exists in SRS for the demo user
    let isAdded = false;
    try {
      const user = await prisma.user.findFirst({ where: { email: "demo@antigravity.local" } });
      if (user) {
        if (isGerman) {
          const existing = await prisma.germanWord.findFirst({
            where: { userId: user.id, term: { equals: translationData.term, mode: 'insensitive' } }
          });
          isAdded = !!existing;
        } else {
          const existing = await prisma.englishWord.findFirst({
            where: { userId: user.id, term: { equals: translationData.term, mode: 'insensitive' } }
          });
          isAdded = !!existing;
        }
      }
    } catch (dbError) {
      console.error("DB Check Error:", dbError);
    }

    return NextResponse.json({ ...translationData, isAdded });
  } catch (error: any) {
    console.error("Translation API Error:", error);

    // Friendly error for quota/rate limits
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Превышен лимит запросов. Пожалуйста, подождите 1-2 минуты и попробуйте снова." },
        { status: 429 }
      );
    }

    // Friendly error for server overload (503)
    if (error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("demand")) {
      return NextResponse.json(
        { error: "Сервера Google сейчас перегружены. Пожалуйста, подождите 30 секунд и попробуйте еще раз." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
