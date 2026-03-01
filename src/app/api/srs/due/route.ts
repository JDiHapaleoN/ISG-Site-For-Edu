import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');

    if (!module || (module !== 'english' && module !== 'german')) {
        return NextResponse.json({ error: "Invalid module specified" }, { status: 400 });
    }

    try {
        const today = new Date();

        if (module === 'german') {
            const dueWords = await prisma.germanWord.findMany({
                where: {
                    nextReview: {
                        lte: today, // less than or equal to today
                    },
                },
                orderBy: {
                    nextReview: 'asc', // prioritize older due cards
                },
                take: 50, // limit to 50 cards per session for performance
            });
            return NextResponse.json(dueWords);
        } else {
            const dueWords = await prisma.englishWord.findMany({
                where: {
                    nextReview: {
                        lte: today,
                    },
                },
                orderBy: {
                    nextReview: 'asc',
                },
                take: 50,
            });
            return NextResponse.json(dueWords);
        }
    } catch (error) {
        console.error("SRS fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch due SRS cards" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
