import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const [
            userCount,
            englishWords,
            germanWords,
            messages,
            cacheEntries,
            broadcasts
        ] = await Promise.all([
            prisma.user.count(),
            prisma.englishWord.count(),
            prisma.germanWord.count(),
            prisma.message.count(),
            prisma.translationCache.count(),
            prisma.broadcast.count()
        ]);

        return NextResponse.json({
            userCount,
            englishWords,
            germanWords,
            messages,
            cacheEntries,
            broadcasts
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
