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
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                lastActive: true,
                isBanned: true,
                banReason: true,
                targetIelts: true,
                targetTestDaf: true
            },
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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Try to delete from Supabase first if we have the service key
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.error("Supabase Auth Delete Error:", authError);
                // We continue to delete from Prisma even if Supabase delete fails 
                // (e.g. if the user doesn't exist in Supabase anymore)
            }
        }

        // Delete from Prisma
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, newPassword, name, isBanned, banReason } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Update Prisma fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (isBanned !== undefined) updateData.isBanned = isBanned;
        if (banReason !== undefined) updateData.banReason = banReason;

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id },
                data: updateData
            });
        }

        // Update Supabase password if provided
        if (newPassword) {
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing. Cannot change passwords.' }, { status: 403 });
            }

            const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
            if (error) {
                console.error("Supabase Admin Update Error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
