import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cache = await prisma.translationCache.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return NextResponse.json(cache);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch cache' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.translationCache.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete cache item' }, { status: 500 });
    }
}
