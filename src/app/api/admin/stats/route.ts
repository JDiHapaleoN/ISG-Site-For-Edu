import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const userCount = await prisma.user.count();
        const englishWords = await prisma.englishWord.count();
        const germanWords = await prisma.germanWord.count();
        const messages = await prisma.message.count();
        const cacheEntries = await prisma.translationCache.count();

        return NextResponse.json({
            userCount,
            englishWords,
            germanWords,
            messages,
            cacheEntries
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
