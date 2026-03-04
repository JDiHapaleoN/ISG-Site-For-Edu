import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

/**
 * GET /api/analytics — Aggregate user stats
 * Returns retention, completion rates, word repetition frequency.
 * Only returns data for the authenticated user (self-only).
 */
export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        // 1. Total events by type
        const eventCounts = await prisma.analyticsEvent.groupBy({
            by: ["event"],
            where: { userId: user.id },
            _count: { id: true },
        });

        // 2. Activity over last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentEvents = await prisma.analyticsEvent.groupBy({
            by: ["event"],
            where: {
                userId: user.id,
                createdAt: { gte: sevenDaysAgo },
            },
            _count: { id: true },
        });

        // 3. SRS stats
        const englishWords = await prisma.englishWord.count({ where: { userId: user.id } });
        const germanWords = await prisma.germanWord.count({ where: { userId: user.id } });
        const englishDue = await prisma.englishWord.count({
            where: { userId: user.id, nextReview: { lte: new Date() } },
        });
        const germanDue = await prisma.germanWord.count({
            where: { userId: user.id, nextReview: { lte: new Date() } },
        });

        // 4. Practice completion rate
        const totalPracticeLogs = await prisma.practiceLog.count({ where: { userId: user.id } });

        // 5. Wizard drop-off (started vs completed)
        const wizardStarted = eventCounts.find(e => e.event === "wizard_started")?._count.id || 0;
        const wizardCompleted = eventCounts.find(e => e.event === "wizard_completed")?._count.id || 0;
        const wizardCompletionRate = wizardStarted > 0
            ? Math.round((wizardCompleted / wizardStarted) * 100)
            : null;

        return NextResponse.json({
            eventCounts: eventCounts.map(e => ({ event: e.event, count: e._count.id })),
            last7Days: recentEvents.map(e => ({ event: e.event, count: e._count.id })),
            srs: {
                english: { total: englishWords, due: englishDue },
                german: { total: germanWords, due: germanDue },
            },
            practice: { totalSessions: totalPracticeLogs },
            wizard: {
                started: wizardStarted,
                completed: wizardCompleted,
                completionRate: wizardCompletionRate,
            },
        });
    } catch (error: any) {
        console.error("[Analytics] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
