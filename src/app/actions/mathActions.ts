"use server";

import { prisma } from "@/lib/prisma";

export async function getMathLogs() {
    try {
        let user = await prisma.user.findFirst({ where: { email: "demo@antigravity.local" } });
        if (!user) {
            user = await prisma.user.create({
                data: { email: "demo@antigravity.local", name: "Demo User" },
            });
        }

        return await prisma.mathLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }
        });
    } catch (error) {
        console.error("Failed to fetch math logs:", error);
        return [];
    }
}

export async function createMathLog(data: {
    topic: string;
    problem: string;
    solution: string;
    errorType: string;
    note?: string; // We'll map this to theorem or handled specially if needed
}) {
    try {
        let user = await prisma.user.findFirst({ where: { email: "demo@antigravity.local" } });
        if (!user) {
            user = await prisma.user.create({
                data: { email: "demo@antigravity.local", name: "Demo User" },
            });
        }

        return await prisma.mathLog.create({
            data: {
                userId: user.id,
                topic: data.topic,
                problem: data.problem,
                solution: data.solution,
                errorType: data.errorType,
                theorem: data.note, // Mapping 'note' to 'theorem' field for now
            }
        });
    } catch (error) {
        console.error("Failed to create math log:", error);
        throw error;
    }
}
