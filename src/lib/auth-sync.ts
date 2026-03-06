import { prisma } from "./prisma";
import { User as SupabaseUser } from "@supabase/supabase-js";

function generateFriendCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function ensurePrismaUser(supabaseUser: SupabaseUser) {
    if (!supabaseUser.email) return null;

    let user = await prisma.user.findUnique({
        where: { email: supabaseUser.email }
    });

    if (!user) {
        let newCode = generateFriendCode();
        // A simple collision retry check could be added, but 36^6 is huge.
        user = await prisma.user.create({
            data: {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || 'Исследователь',
                friendCode: newCode
            }
        });
    } else {
        // Update user name from auth providers if changed, and ensure they have a friendCode
        const updates: any = {
            name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || undefined
        };

        if (!user.friendCode) {
            updates.friendCode = generateFriendCode();
        }

        user = await prisma.user.update({
            where: { id: user.id },
            data: updates
        });
    }

    return user;
}
