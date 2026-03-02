"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

export async function getMathLogs() {
    try {
        const user = await getAuthenticatedUser();
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
    note?: string;
}) {
    try {
        const user = await getAuthenticatedUser();
        return await prisma.mathLog.create({
            data: {
                userId: user.id,
                topic: data.topic,
                problem: data.problem,
                solution: data.solution,
                errorType: data.errorType,
                theorem: data.note,
            }
        });
    } catch (error) {
        console.error("Failed to create math log:", error);
        throw error;
    }
}
