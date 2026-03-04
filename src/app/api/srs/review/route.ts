import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { srsReviewSchema } from "@/lib/validations";
import { invalidateDeckMetadata } from "@/lib/redis";

// SuperMemo-2 Algorithm Helper (server-only)
function calculateSm2(
    quality: number,
    repetitions: number,
    easiness: number,
    interval: number
) {
    let newRepetitions = repetitions;
    let newInterval = interval; // in days (supports fractional)
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
        // 1. Validate input with Zod
        const body = await req.json();
        const parsed = srsReviewSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { wordId, quality, module } = parsed.data;

        // 2. Authenticate
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        // 3. Determine model
        const dbModel = module === 'german' ? prisma.germanWord : prisma.englishWord;

        // 4. Atomic transaction: fetch + calculate + update
        // @ts-ignore - Dynamic model access
        const word = await dbModel.findUnique({
            where: { id: wordId, userId: user.id },
        });

        if (!word) {
            return NextResponse.json({ error: "Word not found" }, { status: 404 });
        }

        // Dedup guard: if word was updated < 2 seconds ago, skip
        const timeSinceLastUpdate = Date.now() - new Date(word.updatedAt).getTime();
        if (timeSinceLastUpdate < 2000) {
            return NextResponse.json(word); // Return current state, already updated
        }

        // 5. Calculate new SM-2 values
        const { newRepetitions, newEasiness, newInterval } = calculateSm2(
            quality,
            word.srsStep,
            word.easiness,
            word.interval
        );

        // 6. Calculate next review date (UTC)
        const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

        // 7. Update atomically
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

        // Invalidate cache
        await invalidateDeckMetadata(user.id, module);

        return NextResponse.json(updatedWord);
    } catch (error) {
        console.error("[SRS Review] Update error:", error);
        return NextResponse.json({ error: "Failed to update SRS data" }, { status: 500 });
    }
}
