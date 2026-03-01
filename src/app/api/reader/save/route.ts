import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ensurePrismaUser } from '@/lib/auth-sync'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    await ensurePrismaUser(user)

    const { title, content, module } = await request.json()

    try {
        const saved = await prisma.savedText.create({
            data: {
                userId: user.id, // We should ensure User exists in Prisma too
                title,
                content,
                module,
                user: {
                    connect: { email: user.email }
                }
            }
        })
        return NextResponse.json(saved)
    } catch (error) {
        console.error('Save error', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
