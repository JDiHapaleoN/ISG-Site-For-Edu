import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
    try {
        const { module, ids } = await req.json();

        if (!module || !ids || (ids !== 'all' && !Array.isArray(ids))) {
            return NextResponse.json({ error: 'Module and IDs are required' }, { status: 400 });
        }

        let result;

        switch (module) {
            case 'english-dictionary':
                result = await (prisma as any).englishWord.deleteMany({
                    where: (ids as any) === 'all' ? {} : { id: { in: ids } }
                });
                break;
            case 'german-dictionary':
                result = await (prisma as any).germanWord.deleteMany({
                    where: (ids as any) === 'all' ? {} : { id: { in: ids } }
                });
                break;
            case 'cache':
                result = await (prisma as any).translationCache.deleteMany({
                    where: (ids as any) === 'all' ? {} : { id: { in: ids } }
                });
                break;
            case 'logs':
                result = await (prisma as any).systemLog.deleteMany({
                    where: (ids as any) === 'all' ? {} : { id: { in: ids } }
                });
                break;
            default:
                return NextResponse.json({ error: 'Invalid module specified' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            count: result.count
        });
    } catch (e) {
        console.error('Bulk delete failed:', e);
        return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 });
    }
}
