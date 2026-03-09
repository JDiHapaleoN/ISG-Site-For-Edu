import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const broadcasts = await prisma.broadcast.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(broadcasts);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { title, content, type } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const broadcast = await prisma.broadcast.create({
            data: { title, content, type: type || 'info' }
        });

        return NextResponse.json(broadcast);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.broadcast.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, isActive } = await req.json();

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const updated = await prisma.broadcast.update({
            where: { id },
            data: { isActive }
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
    }
}
