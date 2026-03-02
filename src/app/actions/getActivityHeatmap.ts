"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getActivityHeatmapData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const today = new Date();
    const past100Days = new Date();
    past100Days.setDate(today.getDate() - 100);

    const [practiceLogs, engSessions, gerSessions, mathSessions] = await Promise.all([
        prisma.practiceLog.findMany({
            where: { userId: user.id, createdAt: { gte: past100Days } },
            select: { createdAt: true }
        }),
        prisma.englishSession.findMany({
            where: { userId: user.id, startTime: { gte: past100Days } },
            select: { startTime: true }
        }),
        prisma.germanSession.findMany({
            where: { userId: user.id, startTime: { gte: past100Days } },
            select: { startTime: true }
        }),
        prisma.mathSession.findMany({
            where: { userId: user.id, startTime: { gte: past100Days } },
            select: { startTime: true }
        })
    ]);

    const allDates = [
        ...practiceLogs.map(l => l.createdAt),
        ...engSessions.map(s => s.startTime),
        ...gerSessions.map(s => s.startTime),
        ...mathSessions.map(s => s.startTime)
    ];

    const countByDate: Record<string, number> = {};
    for (const date of allDates) {
        const dStr = date.toISOString().split('T')[0];
        countByDate[dStr] = (countByDate[dStr] || 0) + 1;
    }

    const data = [];
    for (let i = 99; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const count = countByDate[dStr] || 0;

        // Determine activity level (0-4)
        let level = 0;
        if (count > 0) level = 1;
        if (count >= 3) level = 2;
        if (count >= 5) level = 3;
        if (count >= 8) level = 4;

        data.push({ date: dStr, level, count });
    }

    return data;
}
