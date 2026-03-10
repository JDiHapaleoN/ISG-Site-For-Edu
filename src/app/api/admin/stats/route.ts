import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            userCount,
            englishWords,
            germanWords,
            messages,
            cacheEntries,
            broadcasts,
            ieltsCount,
            testDafCount,
            onlineCount,
            active24h,
            active7d,
            registrations
        ] = await Promise.all([
            prisma.user.count(),
            prisma.englishWord.count(),
            prisma.germanWord.count(),
            prisma.message.count(),
            prisma.translationCache.count(),
            prisma.broadcast.count(),
            prisma.user.count({ where: { NOT: { targetIelts: null } } }),
            prisma.user.count({ where: { NOT: { targetTestDaf: null } } }),
            prisma.user.count({ where: { lastActive: { gte: fiveMinsAgo } } }),
            prisma.user.count({ where: { lastActive: { gte: twentyFourHoursAgo } } }),
            prisma.user.count({ where: { lastActive: { gte: sevenDaysAgo } } }),
            prisma.user.groupBy({
                by: ['createdAt'],
                where: { createdAt: { gte: thirtyDaysAgo } },
                _count: { id: true },
            })
        ]);

        // Process registration trends (group by day)
        const trends = registrations.reduce((acc: any, curr) => {
            const date = curr.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + curr._count.id;
            return acc;
        }, {});

        return NextResponse.json({
            userCount,
            englishWords,
            germanWords,
            totalWords: englishWords + germanWords,
            messages,
            cacheEntries,
            broadcasts,
            goals: {
                ielts: ieltsCount,
                testDaf: testDafCount,
                other: userCount - ieltsCount - testDafCount
            },
            activity: {
                online: onlineCount,
                active24h,
                active7d
            },
            trends: Object.entries(trends).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
