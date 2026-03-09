import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const activeBroadcasts = await prisma.broadcast.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(activeBroadcasts);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch active broadcasts' }, { status: 500 });
    }
}
