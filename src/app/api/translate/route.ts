import { NextResponse } from "next/server";
import { generateContentWithFallback, GeminiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit
    const ip = getClientIp(req);
    const limit = checkRateLimit(`ai:${ip}`, AI_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Слишком много запросов. Подождите ${Math.ceil(limit.resetMs / 1000)} сек.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
      );
    }

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

    const result = await generateContentWithFallback(prompt, { responseMimeType: "application/json" });
    const responseText = result.response.text();
    console.log("Gemini Response:", responseText);

    if (!responseText) throw new Error("No response from Gemini");

    // Clean response from markdown backticks if present
    const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    const translationData = JSON.parse(cleanJson);

    // Check if word already exists in SRS for the authenticated user
    let isAdded = false;
    try {
      const supabase = createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (supabaseUser) {
        const user = await ensurePrismaUser(supabaseUser);
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
      }
    } catch (dbError) {
      console.error("DB Check Error or Auth Error:", dbError);
    }

    return NextResponse.json({ ...translationData, isAdded });
  } catch (error: any) {
    console.error("[Translate] API Error:", error);
    const userMessage = error instanceof GeminiError
      ? error.userMessage
      : (error.message || "Ошибка перевода.");
    const statusCode = error instanceof GeminiError ? error.statusCode : 500;
    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}
