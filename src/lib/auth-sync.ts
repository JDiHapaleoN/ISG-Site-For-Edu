import { prisma } from "./prisma";
import { User as SupabaseUser } from "@supabase/supabase-js";

export async function ensurePrismaUser(supabaseUser: SupabaseUser) {
    if (!supabaseUser.email) return null;

    const user = await prisma.user.upsert({
        where: { email: supabaseUser.email },
        update: {
            name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || undefined,
        },
        create: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.name || 'Исследователь',
        },
    });

    return user;
}
