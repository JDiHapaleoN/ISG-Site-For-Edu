import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { wordData, module } = await req.json();

        if (!wordData || !module) {
            return NextResponse.json({ error: "Missing data or module" }, { status: 400 });
        }

        // In a final app, userId would come from an auth session (e.g., Supabase Auth)
        // For now, we find or create a dummy user
        let user = await prisma.user.findFirst({ where: { email: "demo@antigravity.local" } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: "demo@antigravity.local",
                    name: "Demo User",
                },
            });
        }

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
                    transcription: wordData.transcription,
                    context: wordData.context,
                    contextTranslation: wordData.contextTranslation,
                    mnemonic: wordData.mnemonic,
                    partOfSpeech: wordData.partOfSpeech,
                },
            });
            return NextResponse.json({ success: true, word: newWord });

        } else if (module === "german") {
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
                    article: wordData.article,
                    pluralForm: wordData.pluralForm,
                    context: wordData.context,
                    contextTranslation: wordData.contextTranslation,
                    mnemonic: wordData.mnemonic,
                    partOfSpeech: wordData.partOfSpeech,
                },
            });
            return NextResponse.json({ success: true, word: newWord });
        }

        return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    } catch (error: any) {
        console.error("SRS Add Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
