"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name?: string, avatarUrl?: string, bannerColor?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            ...data
        }
    });

    revalidatePath("/profile");
}

export async function getProfileStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const [engSessions, gerSessions, mathSessions, savedTextsCount, engWords, gerWords] = await Promise.all([
        prisma.englishSession.findMany({ where: { userId: user.id }, select: { durationMins: true } }),
        prisma.germanSession.findMany({ where: { userId: user.id }, select: { durationMins: true } }),
        prisma.mathSession.findMany({ where: { userId: user.id }, select: { durationMins: true } }),
        prisma.savedText.count({ where: { userId: user.id } }),
        prisma.englishWord.count({ where: { userId: user.id } }),
        prisma.germanWord.count({ where: { userId: user.id } }),
    ]);

    const totalMins = [...engSessions, ...gerSessions, ...mathSessions].reduce((acc, s) => acc + (s.durationMins || 0), 0);
    const totalWords = engWords + gerWords;
    const totalSessions = engSessions.length + gerSessions.length + mathSessions.length;

    return {
        totalHours: Math.round(totalMins / 60 * 10) / 10,
        totalWords,
        totalSessions,
        savedTextsCount
    };
}
