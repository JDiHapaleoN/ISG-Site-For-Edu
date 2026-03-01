"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function saveFocusSession(subject: string, durationSeconds: number) {
    try {
        let user = await prisma.user.findFirst({ where: { email: "demo@antigravity.local" } });
        if (!user) {
            user = await prisma.user.create({
                data: { email: "demo@antigravity.local", name: "Demo User" },
            });
        }

        const durationMins = Math.round(durationSeconds / 60);

        if (subject === "english") {
            await prisma.englishSession.create({
                data: { userId: user.id, durationMins, focusScore: 5 }
            });
        } else if (subject === "german") {
            await prisma.germanSession.create({
                data: { userId: user.id, durationMins, focusScore: 5 }
            });
        } else if (subject === "math") {
            await prisma.mathSession.create({
                data: { userId: user.id, durationMins, focusScore: 5 }
            });
        }
    } catch (e) {
        console.error("Failed to save focus session:", e);
    }
}
