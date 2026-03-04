import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { srsDueModuleSchema } from "@/lib/validations";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const moduleParam = searchParams.get('module');

    // Validate module param with Zod
    const parsed = srsDueModuleSchema.safeParse(moduleParam);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid module. Must be 'english' or 'german'." }, { status: 400 });
    }
    const module = parsed.data;

    const supabase = createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
        return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const user = await ensurePrismaUser(supabaseUser);
    if (!user) {
        return NextResponse.json({ error: "User sync failed" }, { status: 500 });
    }

    try {
        const now = new Date();
        const dbModel = module === 'german' ? prisma.germanWord : prisma.englishWord;

        // @ts-ignore - Dynamic model access
        const dueWords = await dbModel.findMany({
            where: {
                userId: user.id,
                nextReview: { lte: now },
            },
            orderBy: { nextReview: 'asc' },
            take: 50,
        });

        return NextResponse.json(dueWords);
    } catch (error) {
        console.error("[SRS Due] Fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch due SRS cards" }, { status: 500 });
    }
}
