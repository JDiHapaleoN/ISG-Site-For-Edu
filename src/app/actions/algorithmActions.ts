"use server";

import { prisma } from "@/lib/prisma";

export async function getAlgorithms() {
    try {
        return await prisma.algorithm.findMany({
            include: { steps: { orderBy: { order: "asc" } } },
            orderBy: { createdAt: "asc" }
        });
    } catch (error) {
        console.error("Failed to fetch algorithms:", error);
        return [];
    }
}

export async function createAlgorithm(data: {
    title: string;
    description: string;
    formula: string;
    steps: { text: string; math?: string; order: number }[];
}) {
    try {
        const { steps, ...algoData } = data;
        return await prisma.algorithm.create({
            data: {
                ...algoData,
                steps: {
                    create: steps
                }
            },
            include: { steps: true }
        });
    } catch (error) {
        console.error("Failed to create algorithm:", error);
        throw error;
    }
}
