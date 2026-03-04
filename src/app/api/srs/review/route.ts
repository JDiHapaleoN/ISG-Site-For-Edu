import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

// SuperMemo-2 Algorithm Helper
// Takes current SRS stats and a quality rating (0-5), returns new stats
// 0: Complete blackout
// 1: Incorrect response; correct one remembered
// 2: Incorrect response; correct one seemed easy to recall
// 3: Correct response recalled with serious difficulty
// 4: Correct response after a hesitation
// 5: Perfect response
function calculateSm2(
    quality: number,
    repetitions: number,
    easiness: number,
    interval: number
) {
    let newRepetitions = repetitions;
    let newInterval = interval; // in days
    let newEasiness = easiness;

    if (quality === 1 || quality === 0) {
        newRepetitions = 0;
        newInterval = 1 / (24 * 60); // 1 minute in days
    } else if (quality === 3) {
        if (repetitions === 0) {
            newInterval = 10 / (24 * 60); // 10 minutes in days
        } else {
            newInterval = Math.max(1, Math.round(interval * 1.2));
        }
        newRepetitions = Math.max(0, repetitions - 1);
    } else if (quality === 4) {
        if (repetitions === 0) {
            newInterval = 1;
        } else if (repetitions === 1) {
            newInterval = 3;
        } else {
            newInterval = Math.round(interval * easiness);
        }
        newRepetitions += 1;
    } else if (quality >= 5) {
        if (repetitions === 0) {
            newInterval = 4;
        } else if (repetitions === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * easiness * 1.3);
        }
        newRepetitions += 1;
    }

    newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEasiness < 1.3) newEasiness = 1.3;

    return { newRepetitions, newEasiness, newInterval };
}

export async function POST(req: Request) {
    try {
        const { wordId, quality, module } = await req.json();

        if (!wordId || quality === undefined || typeof quality !== "number" || !module) {
            return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        if (quality < 0 || quality > 5) {
            return NextResponse.json({ error: "Quality must be between 0 and 5" }, { status: 400 });
        }

        // Determine the model based on the module
        const dbModel = module === 'german' ? prisma.germanWord : prisma.englishWord;

        // 1. Fetch current word data
        // @ts-ignore - Dynamic model access
        const word = await dbModel.findUnique({
            where: { id: wordId, userId: user.id },
        });

        if (!word) {
            return NextResponse.json({ error: "Word not found" }, { status: 404 });
        }

        // 2. Calculate new SM-2 values
        const { newRepetitions, newEasiness, newInterval } = calculateSm2(
            quality,
            word.srsStep,
            word.easiness,
            word.interval
        );

        // 3. Calculate next review date (current date + newInterval in days)
        // Add fractional days as milliseconds to preserve minute-level accuracy
        const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

        // 4. Update the word in the database
        // @ts-ignore
        const updatedWord = await dbModel.update({
            where: { id: wordId },
            data: {
                srsStep: newRepetitions,
                easiness: newEasiness,
                interval: newInterval,
                nextReview: nextReviewDate,
            },
        });

        return NextResponse.json(updatedWord);
    } catch (error) {
        console.error("SRS update error:", error);
        return NextResponse.json({ error: "Failed to update SRS data" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
