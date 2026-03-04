import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job: Daily cleanup of stale data.
 * - Deletes practice logs older than 90 days
 * - Removes empty decks (0 words)
 *
 * Schedule: Daily at 04:00 UTC (via vercel.json)
 * Auth: CRON_SECRET header check
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // 1. Delete old practice logs
        const deletedLogs = await prisma.practiceLog.deleteMany({
            where: {
                createdAt: { lt: ninetyDaysAgo },
            },
        });

        // 2. Delete empty English decks
        const emptyEnglishDecks = await prisma.englishDeck.deleteMany({
            where: {
                words: { none: {} },
            },
        });

        // 3. Delete empty German decks
        const emptyGermanDecks = await prisma.germanDeck.deleteMany({
            where: {
                words: { none: {} },
            },
        });

        const stats = {
            deletedPracticeLogs: deletedLogs.count,
            deletedEmptyEnglishDecks: emptyEnglishDecks.count,
            deletedEmptyGermanDecks: emptyGermanDecks.count,
            timestamp: now.toISOString(),
        };

        console.info("[Cron:Cleanup]", stats);
        return NextResponse.json({ ok: true, ...stats });
    } catch (error: any) {
        console.error("[Cron:Cleanup] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
