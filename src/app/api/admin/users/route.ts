import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// We need SUPABASE_SERVICE_ROLE_KEY to delete auth users or change their passwords via the Admin API.
// If it's missing, we gracefully degrade to just deleting from Prisma.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        // Try to delete from Supabase Auth if we have the service key
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.error("Supabase Admin Delete Error:", authError);
                // We don't fail completely if auth delete fails, but it's good to log
            }
        } else {
            console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Only deleting from Prisma.");
        }

        // Delete from Prisma (will cascade and delete all associated records)
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, newPassword } = await req.json();
        if (!id || !newPassword) return NextResponse.json({ error: 'ID and new password are required' }, { status: 400 });

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing. Cannot change passwords.' }, { status: 403 });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
        if (error) {
            console.error("Supabase Admin Update Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update user password' }, { status: 500 });
    }
}
