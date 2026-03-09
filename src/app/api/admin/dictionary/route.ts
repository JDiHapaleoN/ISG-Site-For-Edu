import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const module = searchParams.get('module') || 'english'; // 'english' | 'german'

        if (module === 'german') {
            const words = await prisma.germanWord.findMany({
                include: { user: { select: { email: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return NextResponse.json(words);
        } else {
            const words = await prisma.englishWord.findMany({
                include: { user: { select: { email: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            return NextResponse.json(words);
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch dictionary' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const module = searchParams.get('module');

        if (!id || !module) return NextResponse.json({ error: 'ID and module required' }, { status: 400 });

        if (module === 'german') {
            await prisma.germanWord.delete({ where: { id } });
        } else {
            await prisma.englishWord.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }
}
