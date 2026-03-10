import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get some system meta-info
        const [logCount, cacheCount, oldestLog] = await Promise.all([
            prisma.systemLog.count(),
            prisma.translationCache.count(),
            prisma.systemLog.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
        ]);

        return NextResponse.json({
            status: 'healthy',
            environment: process.env.NODE_ENV,
            database: 'connected',
            metrics: {
                totalLogs: logCount,
                totalCache: cacheCount,
                oldestLogDate: oldestLog?.createdAt || null
            },
            version: '4.0.0'
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch system info' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { action } = await req.json();

        if (action === 'prune-logs') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deleted = await prisma.systemLog.deleteMany({
                where: { createdAt: { lt: thirtyDaysAgo } }
            });

            await prisma.systemLog.create({
                data: {
                    level: 'info',
                    message: `System Cleanup: Pruned ${deleted.count} old logs`,
                    context: 'SystemMaintenance',
                    userId: user.id
                }
            });

            return NextResponse.json({ success: true, prunedCount: deleted.count });
        }

        if (action === 'clear-cache') {
            const deleted = await prisma.translationCache.deleteMany({});

            await prisma.systemLog.create({
                data: {
                    level: 'warn',
                    message: `System Action: Translation cache fully cleared (${deleted.count} items)`,
                    context: 'SystemMaintenance',
                    userId: user.id
                }
            });

            return NextResponse.json({ success: true, clearedCount: deleted.count });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'System action failed' }, { status: 500 });
    }
}
