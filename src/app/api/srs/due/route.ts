import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');

    if (!module || (module !== 'english' && module !== 'german')) {
        return NextResponse.json({ error: "Invalid module specified" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
        return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const user = await ensurePrismaUser(supabaseUser);
    if (!user) {
        return NextResponse.json({ error: "User sync failed" }, { status: 500 });
    }

    try {
        const today = new Date();

        if (module === 'german') {
            const dueWords = await prisma.germanWord.findMany({
                where: {
                    userId: user.id,
                    nextReview: {
                        lte: today,
                    },
                },
                orderBy: {
                    nextReview: 'asc',
                },
                take: 50,
            });
            return NextResponse.json(dueWords);
        } else {
            const dueWords = await prisma.englishWord.findMany({
                where: {
                    userId: user.id,
                    nextReview: {
                        lte: today,
                    },
                },
                orderBy: {
                    nextReview: 'asc',
                },
                take: 50,
            });
            return NextResponse.json(dueWords);
        }
    } catch (error) {
        console.error("SRS fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch due SRS cards" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
