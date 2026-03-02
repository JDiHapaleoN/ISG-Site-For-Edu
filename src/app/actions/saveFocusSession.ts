"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function saveFocusSession(subject: string, durationSeconds: number) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("Unauthorized: Cannot save focus session without user");
            return;
        }

        const durationMins = Math.round(durationSeconds / 60);
        const now = new Date();

        if (subject === "english") {
            await prisma.englishSession.create({
                data: { userId: user.id, durationMins, focusScore: 5, startTime: now }
            });
        } else if (subject === "german") {
            await prisma.germanSession.create({
                data: { userId: user.id, durationMins, focusScore: 5, startTime: now }
            });
        } else if (subject === "math") {
            await prisma.mathSession.create({
                data: { userId: user.id, durationMins, focusScore: 5, startTime: now }
            });
        }
    } catch (e) {
        console.error("Failed to save focus session:", e);
    }
}
