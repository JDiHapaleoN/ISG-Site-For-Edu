import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const level = searchParams.get('level');
        const context = searchParams.get('context');
        const limit = parseInt(searchParams.get('limit') || '50');

        const logs = await prisma.systemLog.findMany({
            where: {
                ...(level && { level }),
                ...(context && { context }),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (e) {
        console.error('Failed to fetch logs:', e);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { level, message, context, userId, metadata } = await req.json();

        if (!level || !message) {
            return NextResponse.json({ error: 'Level and message are required' }, { status: 400 });
        }

        const log = await prisma.systemLog.create({
            data: {
                level,
                message,
                context,
                userId,
                metadata: metadata || {}
            }
        });

        return NextResponse.json(log);
    } catch (e) {
        console.error('Failed to create log:', e);
        return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }
}
