import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

// GET: Fetch all friend relations (accepted and pending requests) with chat metadata
export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        // Get requests where user is either sender (user1) or receiver (user2)
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id }
                ]
            },
            include: {
                user1: { select: { id: true, name: true, avatarUrl: true, friendCode: true } },
                user2: { select: { id: true, name: true, avatarUrl: true, friendCode: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Build enriched friend list with chat metadata
        const friends = await Promise.all(friendships.map(async (f) => {
            const isSender = f.user1Id === user.id;
            const friendProfile = isSender ? f.user2 : f.user1;
            const friendUserId = friendProfile.id;

            let lastMessage = null;
            let unreadCount = 0;

            if (f.status === 'accepted') {
                // Get the last message between us
                const lastMsg = await prisma.message.findFirst({
                    where: {
                        OR: [
                            { senderId: user.id, receiverId: friendUserId },
                            { senderId: friendUserId, receiverId: user.id }
                        ]
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { content: true, createdAt: true, senderId: true }
                });

                if (lastMsg) {
                    lastMessage = {
                        content: lastMsg.content,
                        createdAt: lastMsg.createdAt,
                        isMe: lastMsg.senderId === user.id,
                    };
                }

                // Count unread messages from this friend
                unreadCount = await prisma.message.count({
                    where: {
                        senderId: friendUserId,
                        receiverId: user.id,
                        read: false,
                    }
                });
            }

            return {
                id: f.id,
                status: f.status,
                isSender,
                createdAt: f.createdAt,
                friend: friendProfile,
                lastMessage,
                unreadCount,
            };
        }));

        // Sort accepted friends by last message time (most recent first)
        friends.sort((a, b) => {
            if (a.status !== 'accepted' && b.status !== 'accepted') return 0;
            if (a.status !== 'accepted') return 1;
            if (b.status !== 'accepted') return -1;
            const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        return NextResponse.json(friends);
    } catch (error) {
        console.error("API GET friends error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Send a new friend request using a friend code
export async function POST(req: Request) {
    try {
        const { friendCode } = await req.json();

        if (!friendCode) {
            return NextResponse.json({ error: "Необходим код друга" }, { status: 400 });
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) return NextResponse.json({ error: "User sync failed" }, { status: 500 });

        if (user.friendCode === friendCode.toUpperCase()) {
            return NextResponse.json({ error: "Вы не можете добавить себя в друзья" }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { friendCode: friendCode.toUpperCase() }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Пользователь с таким кодом не найден" }, { status: 404 });
        }

        // Check if friendship already exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: user.id, user2Id: targetUser.id },
                    { user1Id: targetUser.id, user2Id: user.id }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'pending') {
                if (existing.user2Id === user.id) {
                    // They already sent US a request, let's just accept it!
                    const accepted = await prisma.friendship.update({
                        where: { id: existing.id },
                        data: { status: 'accepted' }
                    });
                    return NextResponse.json({ success: true, friendship: accepted, message: "Заявка принята!" });
                }
                return NextResponse.json({ error: "Заявка в друзья уже отправлена" }, { status: 400 });
            }
            if (existing.status === 'accepted') {
                return NextResponse.json({ error: "Вы уже друзья!" }, { status: 400 });
            }
        }

        const newFriendship = await prisma.friendship.create({
            data: {
                user1Id: user.id,
                user2Id: targetUser.id,
                status: 'pending'
            }
        });

        return NextResponse.json({ success: true, friendship: newFriendship });
    } catch (error) {
        console.error("API POST friends error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
