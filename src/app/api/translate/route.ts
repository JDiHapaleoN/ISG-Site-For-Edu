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
    const cacheKeyWord = word.trim().toLowerCase();

    // Helper to check if the current user already has this word in their SRS dictionary
    const checkIsAdded = async (term: string) => {
      try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (!supabaseUser) return false;

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return false;

        if (isGerman) {
          const existing = await prisma.germanWord.findFirst({
            where: { userId: user.id, term: { equals: term, mode: 'insensitive' } },
            select: { id: true }
          });
          return !!existing;
        } else {
          const existing = await prisma.englishWord.findFirst({
            where: { userId: user.id, term: { equals: term, mode: 'insensitive' } },
            select: { id: true }
          });
          return !!existing;
        }
      } catch (e) {
        console.error("User dictionary check error:", e);
        return false;
      }
    };

    // 1. Check Global DB Cache
    try {
      const cached = await prisma.translationCache.findUnique({
        where: { word_module: { word: cacheKeyWord, module } }
      });

      if (cached) {
        console.log(`[Translate Cache Hit] ${cacheKeyWord}`);
        const translationData = JSON.parse(cached.translationData);
        const isAdded = await checkIsAdded(translationData.term);
        return NextResponse.json({ ...translationData, isAdded });
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }

    // 2. Fetch from Gemini if not cached
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
    console.log(`[Translate API Hit] ${cacheKeyWord}`);

    if (!responseText) throw new Error("No response from Gemini");

    const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    const translationData = JSON.parse(cleanJson);

    // 3. Save to Global DB Cache
    try {
      await prisma.translationCache.upsert({
        where: { word_module: { word: cacheKeyWord, module } },
        update: { translationData: JSON.stringify(translationData) },
        create: {
          word: cacheKeyWord,
          module,
          translationData: JSON.stringify(translationData)
        }
      });
    } catch (e) {
      console.error("Cache write error:", e);
    }

    // Check if added to user dictionary
    const isAdded = await checkIsAdded(translationData.term);

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
