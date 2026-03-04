import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { srsAddSchema, englishWordSchema, germanWordSchema } from "@/lib/validations";
import { checkRateLimit, WORD_CREATION_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";
import { invalidateDeckMetadata } from "@/lib/redis";
import { trackEvent, EVENTS } from "@/lib/analytics";

export async function POST(req: Request) {
    try {
        // Rate limit
        const ip = getClientIp(req);
        const limit = checkRateLimit(`word:${ip}`, WORD_CREATION_RATE_LIMIT);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: `Слишком много запросов. Подождите ${Math.ceil(limit.resetMs / 1000)} сек.` },
                { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
            );
        }

        const body = await req.json();

        // 1. Base validation
        const baseParsed = srsAddSchema.safeParse(body);
        if (!baseParsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: baseParsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { module } = baseParsed.data;

        // 2. Per-module word validation
        const wordSchema = module === "english" ? englishWordSchema : germanWordSchema;
        const wordParsed = wordSchema.safeParse(body.wordData);
        if (!wordParsed.success) {
            return NextResponse.json(
                { error: "Word data validation failed", details: wordParsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const wordData = wordParsed.data;

        // 3. Authenticate
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        // 4. Create word
        if (module === "english") {
            let deck = await prisma.englishDeck.findFirst({ where: { userId: user.id } });
            if (!deck) {
                deck = await prisma.englishDeck.create({
                    data: { userId: user.id, name: "Default English Deck" },
                });
            }

            const newWord = await prisma.englishWord.create({
                data: {
                    deckId: deck.id,
                    userId: user.id,
                    term: wordData.term,
                    translation: wordData.translation,
                    transcription: (wordData as any).transcription,
                    context: wordData.context,
                    contextTranslation: wordData.contextTranslation,
                    mnemonic: wordData.mnemonic,
                    partOfSpeech: wordData.partOfSpeech,
                },
            });

            // Invalidate cache
            await invalidateDeckMetadata(user.id, "english");

            trackEvent(EVENTS.SRS_WORD_ADDED, user.id, { module: "english", wordId: newWord.id });

            return NextResponse.json({ success: true, word: newWord });

        } else {
            let deck = await prisma.germanDeck.findFirst({ where: { userId: user.id } });
            if (!deck) {
                deck = await prisma.germanDeck.create({
                    data: { userId: user.id, name: "Default German Deck" },
                });
            }

            const newWord = await prisma.germanWord.create({
                data: {
                    deckId: deck.id,
                    userId: user.id,
                    term: wordData.term,
                    translation: wordData.translation,
                    article: (wordData as any).article,
                    pluralForm: (wordData as any).pluralForm,
                    context: wordData.context,
                    contextTranslation: wordData.contextTranslation,
                    mnemonic: wordData.mnemonic,
                    partOfSpeech: wordData.partOfSpeech,
                },
            });

            // Invalidate cache
            await invalidateDeckMetadata(user.id, "german");

            trackEvent(EVENTS.SRS_WORD_ADDED, user.id, { module: "german", wordId: newWord.id });

            return NextResponse.json({ success: true, word: newWord });
        }
    } catch (error: any) {
        console.error("[SRS Add] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
