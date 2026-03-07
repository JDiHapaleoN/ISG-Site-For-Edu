import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { srsReviewSchema } from "@/lib/validations";
import { invalidateDeckMetadata } from "@/lib/redis";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { calculateNextSequence } from "@/lib/srs";

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

        // 5. Calculate new SM-2 values
        const { newRepetitions, newEasiness, newInterval } = calculateNextSequence(
            quality,
            word.srsStep,
            word.easiness,
            word.interval
        );

        // 6. Calculate next review date (UTC)
        // interval=0 means "due right now", positive values are days into the future
        const nextReviewDate = newInterval <= 0
            ? new Date()  // Due immediately
            : new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

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

        // Track analytics
        trackEvent(EVENTS.SRS_CARD_REVIEWED, user.id, { module, quality, wordId });

        return NextResponse.json(updatedWord);
    } catch (error) {
        console.error("[SRS Review] Update error:", error);
        return NextResponse.json({ error: "Failed to update SRS data" }, { status: 500 });
    }
}
