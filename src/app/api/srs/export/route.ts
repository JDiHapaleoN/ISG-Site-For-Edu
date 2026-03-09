import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { BRAND_NAME } from '@/lib/constants';

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const module = searchParams.get('module');

        if (module !== 'english' && module !== 'german') {
            return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
        }

        const words = module === 'english'
            ? await prisma.englishWord.findMany({ where: { userId: user.id } })
            : await prisma.germanWord.findMany({ where: { userId: user.id } });

        // Transform for export: clean up local IDs and SRS stats to keep it universal
        // but keep content. Also add metadata.
        const exportData = {
            metadata: {
                author: user.user_metadata?.display_name || user.email,
                module,
                exportedAt: new Date().toISOString(),
                version: "1.0",
                source: BRAND_NAME
            },
            words: words.map(w => ({
                term: w.term,
                translation: w.translation,
                transcription: (w as any).transcription || null,
                article: (w as any).article || null,
                context: w.context,
                contextTranslation: w.contextTranslation,
                mnemonic: w.mnemonic,
                partOfSpeech: w.partOfSpeech
            }))
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="ISG_${module}_dictionary_${user.id.slice(0, 5)}.json"`
            }
        });

    } catch (e) {
        console.error('Export failed:', e);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
