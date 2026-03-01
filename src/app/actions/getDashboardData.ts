"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Exam Readiness (Heuristics based on DB counts)
    const engSessions = await prisma.englishSession.count();
    const engWords = await prisma.englishWord.count();
    const ieltsLogs = await prisma.practiceLog.findMany({
        where: { module: 'english' },
        select: { score: true }
    });
    const avgIeltsScore = ieltsLogs.length > 0
        ? ieltsLogs.reduce((acc, log) => acc + (log.score || 0), 0) / ieltsLogs.length
        : 0;

    // Readiness: sessions target=20, words target=100, score target=7.5
    const ieltsReadiness = Math.round(
        (Math.min(engSessions / 20, 1) * 40) +
        (Math.min(engWords / 100, 1) * 40) +
        (Math.min(avgIeltsScore / 7.5, 1) * 20)
    );

    const gerSessions = await prisma.germanSession.count();
    const gerWords = await prisma.germanWord.count();
    const dafLogs = await prisma.practiceLog.findMany({
        where: { module: 'german' },
        select: { score: true }
    });
    const avgDafScore = dafLogs.length > 0
        ? dafLogs.reduce((acc, log) => acc + (log.score || 0), 0) / dafLogs.length
        : 0;

    // Readiness: sessions target=20, words target=100, score target=5.0
    const dafReadiness = Math.round(
        (Math.min(gerSessions / 20, 1) * 40) +
        (Math.min(gerWords / 100, 1) * 40) +
        (Math.min(avgDafScore / 5.0, 1) * 20)
    );

    const mathSessionsCount = await prisma.mathSession.count();
    const mathLogsCount = await prisma.mathLog.count();
    // Readiness: sessions target=20, logs target=30
    const mathReadiness = Math.round(
        (Math.min(mathSessionsCount / 20, 1) * 50) +
        (Math.min(mathLogsCount / 30, 1) * 50)
    );

    // 2. Words to review today (nextReview <= now)
    const now = new Date();
    const engReviewCount = await prisma.englishWord.count({
        where: { nextReview: { lte: now } }
    });
    const gerReviewCount = await prisma.germanWord.count({
        where: { nextReview: { lte: now } }
    });
    const totalWordsToReview = engReviewCount + gerReviewCount;

    // 3. Streak Calculation
    const allEngSessions = await prisma.englishSession.findMany({ select: { startTime: true } });
    const allGerSessions = await prisma.germanSession.findMany({ select: { startTime: true } });
    const allMathSessions = await prisma.mathSession.findMany({ select: { startTime: true } });
    const allPractice = await prisma.practiceLog.findMany({ select: { createdAt: true } });

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

    // If no activity today, check if there was activity yesterday (streaks don't reset until a full day is missed)
    if (!uniqueDateStrs.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (uniqueDateStrs.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // 4. Daily Quests Progress
    // Pomodoro (just testing total sessions today)
    const sessionsToday = allDates.filter(d => {
        const dt = new Date(d);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === today.getTime();
    }).length;
    const pomodoroCompleted = sessionsToday >= 2;

    // Essay
    const essaysToday = allPractice.filter(p => {
        const dt = new Date(p.createdAt);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === today.getTime();
    }).length;
    const essayCompleted = essaysToday >= 1;

    // SRS
    const reviewedToday = await prisma.englishWord.count({
        where: { updatedAt: { gte: today } }
    }) + await prisma.germanWord.count({
        where: { updatedAt: { gte: today } }
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
