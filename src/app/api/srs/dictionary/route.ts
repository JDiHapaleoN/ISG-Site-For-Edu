import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const module = url.searchParams.get("module") || "english";

        let words: any[] = [];

        if (module === "english") {
            const decks = await prisma.englishDeck.findMany({
                where: { userId: user.id },
                include: {
                    words: {
                        orderBy: { createdAt: "desc" }
                    }
                }
            });
            words = decks.flatMap(deck => deck.words);
        } else if (module === "german") {
            const decks = await prisma.germanDeck.findMany({
                where: { userId: user.id },
                include: {
                    words: {
                        orderBy: { createdAt: "desc" }
                    }
                }
            });
            words = decks.flatMap(deck => deck.words);
        } else {
            return NextResponse.json({ error: "Invalid module" }, { status: 400 });
        }

        return NextResponse.json(words);

    } catch (error) {
        console.error("Error fetching dictionary API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        const module = url.searchParams.get("module");

        if (!id || !module) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (module === "english") {
            // Verify ownership via Deck
            const word = await prisma.englishWord.findUnique({
                where: { id },
                include: { deck: true }
            });
            if (!word || word.deck.userId !== user.id) {
                return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
            }
            await prisma.englishWord.delete({ where: { id } });
            return NextResponse.json({ success: true });
        } else if (module === "german") {
            // Verify ownership via Deck
            const word = await prisma.germanWord.findUnique({
                where: { id },
                include: { deck: true }
            });
            if (!word || word.deck.userId !== user.id) {
                return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
            }
            await prisma.germanWord.delete({ where: { id } });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid module" }, { status: 400 });

    } catch (error) {
        console.error("Error deleting dictionary word:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
