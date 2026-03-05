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

    const { text, module, highlights } = await request.json()

    try {
        await prisma.user.update({
            where: { email: user.email },
            data: {
                activeReaderText: text,
                activeReaderModule: module,
                activeReaderHighlights: highlights || []
            }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Persistence error', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
