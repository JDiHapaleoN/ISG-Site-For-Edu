"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Exam Readiness (Heuristics based on DB counts for SPECIFIC user)
    const [engSessions, engWords, gerSessions, gerWords, mathSessionsCount, mathLogsCount] = await Promise.all([
        prisma.englishSession.count({ where: { userId: user.id } }),
        prisma.englishWord.count({ where: { userId: user.id } }),
        prisma.germanSession.count({ where: { userId: user.id } }),
        prisma.germanWord.count({ where: { userId: user.id } }),
        prisma.mathSession.count({ where: { userId: user.id } }),
        prisma.mathLog.count({ where: { userId: user.id } }),
    ]);

    const ieltsLogs = await prisma.practiceLog.findMany({
        where: { userId: user.id, module: 'english' },
        select: { score: true }
    });
    const avgIeltsScore = ieltsLogs.length > 0
        ? ieltsLogs.reduce((acc: number, log: any) => acc + (log.score || 0), 0) / ieltsLogs.length
        : 0;

    const ieltsReadiness = Math.round(
        (Math.min(engSessions / 20, 1) * 40) +
        (Math.min(engWords / 100, 1) * 40) +
        (Math.min(avgIeltsScore / 7.5, 1) * 20)
    );

    const dafLogs = await prisma.practiceLog.findMany({
        where: { userId: user.id, module: 'german' },
        select: { score: true }
    });
    const avgDafScore = dafLogs.length > 0
        ? dafLogs.reduce((acc: number, log: any) => acc + (log.score || 0), 0) / dafLogs.length
        : 0;

    const dafReadiness = Math.round(
        (Math.min(gerSessions / 20, 1) * 40) +
        (Math.min(gerWords / 100, 1) * 40) +
        (Math.min(avgDafScore / 5.0, 1) * 20)
    );

    const mathReadiness = Math.round(
        (Math.min(mathSessionsCount / 20, 1) * 50) +
        (Math.min(mathLogsCount / 30, 1) * 50)
    );

    // 2. Words to review today
    const now = new Date();
    const [engReviewCount, gerReviewCount] = await Promise.all([
        prisma.englishWord.count({
            where: { userId: user.id, nextReview: { lte: now } }
        }),
        prisma.germanWord.count({
            where: { userId: user.id, nextReview: { lte: now } }
        })
    ]);
    const totalWordsToReview = engReviewCount + gerReviewCount;

    // 3. Streak Calculation
    const [allEngSessions, allGerSessions, allMathSessions, allPractice] = await Promise.all([
        prisma.englishSession.findMany({ where: { userId: user.id }, select: { startTime: true } }),
        prisma.germanSession.findMany({ where: { userId: user.id }, select: { startTime: true } }),
        prisma.mathSession.findMany({ where: { userId: user.id }, select: { startTime: true } }),
        prisma.practiceLog.findMany({ where: { userId: user.id }, select: { createdAt: true } }),
    ]);

    const allDates = [
        ...allEngSessions.map(s => s.startTime),
        ...allGerSessions.map(s => s.startTime),
        ...allMathSessions.map(s => s.startTime),
        ...allPractice.map(s => s.createdAt),
    ];

    const uniqueDateStrs = new Set(allDates.map(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }));

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    if (!uniqueDateStrs.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (uniqueDateStrs.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // 4. Daily Quests Progress
    const sessionsToday = allDates.filter(d => {
        const dt = new Date(d);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === today.getTime();
    }).length;
    const pomodoroCompleted = sessionsToday >= 2;

    const essaysToday = allPractice.filter(p => {
        const dt = new Date(p.createdAt);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === today.getTime();
    }).length;
    const essayCompleted = essaysToday >= 1;

    const reviewedToday = await prisma.englishWord.count({
        where: { userId: user.id, updatedAt: { gte: today } }
    }) + await prisma.germanWord.count({
        where: { userId: user.id, updatedAt: { gte: today } }
    });
    const srsCompleted = reviewedToday > 0 && totalWordsToReview === 0;

    return {
        readiness: {
            ielts: ieltsReadiness,
            testdaf: dafReadiness,
            math: mathReadiness
        },
        streak,
        wordsToReview: totalWordsToReview,
        quests: {
            pomodoro: pomodoroCompleted,
            srs: srsCompleted,
            essay: essayCompleted
        }
    };
}
