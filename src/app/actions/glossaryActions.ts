"use server";

import { prisma } from "@/lib/prisma";

export async function getGlossaryItems() {
    try {
        return await prisma.mathTerm.findMany({
            orderBy: { termRu: "asc" }
        });
    } catch (error) {
        console.error("Failed to fetch glossary:", error);
        return [];
    }
}

export async function createGlossaryItem(data: {
    termRu: string;
    termEn: string;
    termDe: string;
    definitionRu: string;
    formula?: string;
}) {
    try {
        return await prisma.mathTerm.create({
            data
        });
    } catch (error) {
        console.error("Failed to create glossary item:", error);
        throw error;
    }
}
