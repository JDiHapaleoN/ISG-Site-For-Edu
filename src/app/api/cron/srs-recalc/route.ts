import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job: Recalculate overdue SRS cards.
 * Words that haven't been reviewed in 30+ days past their due date
 * get their nextReview reset to now so they appear in the queue again.
 *
 * Schedule: Daily at 03:00 UTC (via vercel.json)
 * Auth: CRON_SECRET header check
 */
export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Reset stuck English words
        const englishResult = await prisma.englishWord.updateMany({
            where: {
                nextReview: { lt: thirtyDaysAgo },
            },
            data: {
                nextReview: now,
                interval: 0,
                srsStep: 0,
            },
        });

        // Reset stuck German words
        const germanResult = await prisma.germanWord.updateMany({
            where: {
                nextReview: { lt: thirtyDaysAgo },
            },
            data: {
                nextReview: now,
                interval: 0,
                srsStep: 0,
            },
        });

        const stats = {
            englishReset: englishResult.count,
            germanReset: germanResult.count,
            timestamp: now.toISOString(),
        };

        console.info("[Cron:SRS-Recalc]", stats);
        return NextResponse.json({ ok: true, ...stats });
    } catch (error: any) {
        console.error("[Cron:SRS-Recalc] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
