import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

// PUT: Accept or reject a friend request
export async function PUT(req: Request) {
    try {
        const { friendshipId, action } = await req.json(); // action: 'accept' or 'reject'

        if (!friendshipId || !['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) {
            return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
        }

        // Only the receiver (user2) can accept/reject the request
        if (friendship.user2Id !== user.id) {
            return NextResponse.json({ error: "У вас нет прав на это действие" }, { status: 403 });
        }

        if (action === 'accept') {
            const updated = await prisma.friendship.update({
                where: { id: friendshipId },
                data: { status: 'accepted' }
            });
            return NextResponse.json({ success: true, friendship: updated });

        } else if (action === 'reject') {
            await prisma.friendship.delete({
                where: { id: friendshipId }
            });
            return NextResponse.json({ success: true, message: "Заявка отклонена" });
        }

    } catch (error) {
        console.error("API PUT friends request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
