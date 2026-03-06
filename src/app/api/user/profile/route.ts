import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (userId) {
            // Fetch someone else's minimal public profile
            const profile = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    friendCode: true
                }
            });

            if (!profile) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
            return NextResponse.json(profile);
        }

        // Fetch own complete profile
        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        return NextResponse.json(user);

    } catch (error) {
        console.error("API GET user profile error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
