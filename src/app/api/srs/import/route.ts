import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { words, metadata } = body;

        if (!words || !Array.isArray(words)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const module = metadata?.module;
        if (module !== 'english' && module !== 'german') {
            return NextResponse.json({ error: 'Missing or invalid module in metadata' }, { status: 400 });
        }

        // Get existing terms to avoid duplicates
        const existingWords = module === 'english'
            ? await prisma.englishWord.findMany({ where: { userId: user.id }, select: { term: true } })
            : await prisma.germanWord.findMany({ where: { userId: user.id }, select: { term: true } });

        const existingTerms = new Set(existingWords.map(w => w.term.toLowerCase().trim()));

        // Find or create default deck
        let deckId: string;
        if (module === 'english') {
            const deck = await prisma.englishDeck.findFirst({ where: { userId: user.id } });
            if (!deck) {
                const newDeck = await prisma.englishDeck.create({
                    data: { userId: user.id, name: "Imported Deck" }
                });
                deckId = newDeck.id;
            } else {
                deckId = deck.id;
            }
        } else {
            const deck = await prisma.germanDeck.findFirst({ where: { userId: user.id } });
            if (!deck) {
                const newDeck = await prisma.germanDeck.create({
                    data: { userId: user.id, name: "Imported Deck" }
                });
                deckId = newDeck.id;
            } else {
                deckId = deck.id;
            }
        }

        const imported: string[] = [];
        const skipped: string[] = [];

        for (const w of words) {
            const term = w.term?.trim();
            if (!term) continue;

            if (existingTerms.has(term.toLowerCase())) {
                skipped.push(term);
                continue;
            }

            if (module === 'english') {
                await prisma.englishWord.create({
                    data: {
                        userId: user.id,
                        deckId,
                        term: w.term,
                        translation: w.translation,
                        transcription: w.transcription,
                        context: w.context,
                        contextTranslation: w.contextTranslation,
                        mnemonic: w.mnemonic,
                        partOfSpeech: w.partOfSpeech,
                    }
                });
            } else {
                await prisma.germanWord.create({
                    data: {
                        userId: user.id,
                        deckId,
                        term: w.term,
                        translation: w.translation,
                        context: w.context,
                        contextTranslation: w.contextTranslation,
                        mnemonic: w.mnemonic,
                        partOfSpeech: w.partOfSpeech,
                    }
                });
            }
            imported.push(term);
        }

        return NextResponse.json({
            success: true,
            stats: {
                total: words.length,
                imported: imported.length,
                skipped: skipped.length
            },
            skippedWords: skipped
        });

    } catch (e) {
        console.error('Import failed:', e);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
