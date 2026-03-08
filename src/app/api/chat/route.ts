import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

// GET: Fetch messages between the authed user and another user
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const friendId = searchParams.get('friendId');

        if (!friendId) {
            return NextResponse.json({ error: "Необходим ID друга" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        // Ensure they are actually friends
        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'accepted',
                OR: [
                    { user1Id: user.id, user2Id: friendId },
                    { user1Id: friendId, user2Id: user.id }
                ]
            }
        });

        if (!friendship) {
            return NextResponse.json({ error: "Вы не можете читать эти сообщения" }, { status: 403 });
        }

        // Fetch last 200 messages
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: friendId },
                    { senderId: friendId, receiverId: user.id }
                ]
            },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        // Prisma returns latest first because of desc order. Reverse it for chat UI.
        const chatOrder = messages.reverse();

        // Mark unread messages as read asynchronously
        const unreadIds = messages
            .filter(m => m.receiverId === user.id && !m.read)
            .map(m => m.id);

        if (unreadIds.length > 0) {
            prisma.message.updateMany({
                where: { id: { in: unreadIds } },
                data: { read: true }
            }).catch(console.error);
        }

        return NextResponse.json(chatOrder);

    } catch (error) {
        console.error("API GET chat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(req: Request) {
    try {
        const { friendId, content } = await req.json();

        if (!friendId || !content || content.trim() === '') {
            return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'accepted',
                OR: [
                    { user1Id: user.id, user2Id: friendId },
                    { user1Id: friendId, user2Id: user.id }
                ]
            }
        });

        if (!friendship) {
            return NextResponse.json({ error: "Вы не можете отправлять сообщения этому пользователю" }, { status: 403 });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId: user.id,
                receiverId: friendId,
                content: content.trim()
            },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } }
            }
        });

        return NextResponse.json({ success: true, message: newMessage });

    } catch (error) {
        console.error("API POST chat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete own message
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get('id');

        if (!messageId) {
            return NextResponse.json({ error: "Необходим ID сообщения" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        // Only allow deleting own messages
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 });
        }

        if (message.senderId !== user.id) {
            return NextResponse.json({ error: "Вы можете удалять только свои сообщения" }, { status: 403 });
        }

        await prisma.message.delete({
            where: { id: messageId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("API DELETE chat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
