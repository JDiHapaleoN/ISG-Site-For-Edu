import { NextResponse } from "next/server";
import { generateContentWithFallback, GeminiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";
import { trackEvent, EVENTS } from "@/lib/analytics";

export async function POST(req: Request) {
    try {
        // Rate limit
        const ip = getClientIp(req);
        const limit = checkRateLimit(`ai:${ip}`, AI_RATE_LIMIT);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: `Слишком много запросов. Подождите ${Math.ceil(limit.resetMs / 1000)} сек.` },
                { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
            );
        }

        const { concept, category, explanation } = await req.json();

        if (!concept || !category || !explanation) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const systemPrompt = `
You are simulating a 12-year-old student who is very curious but doesn't know any advanced jargon. 
The user is trying to explain the concept of "${concept}" (Category: ${category}) to you using the Feynman Technique.

Listen to their explanation. If they use complex jargon, say you don't understand that word and ask them to clarify.
If they make a logical leap, point out that you are confused how A leads to B.
If the explanation is perfect and simple, praise them and summarize what you understood.

Your response MUST be in Russian, as the user's L1 is Russian.

Format your response in simple HTML suitable for dangerouslySetInnerHTML.
Structure:
<div class="space-y-4">
  <p><strong>Твоя реакция 12-летнего:</strong> [Напиши здесь свои мысли, вопросы или путаницу от лица ребенка]</p>
  
  <div class="bg-fuchsia-50 dark:bg-fuchsia-950/30 p-4 rounded-xl border border-fuchsia-100 dark:border-fuchsia-900/30 text-zinc-900 dark:text-zinc-100">
    <h4 class="font-bold mb-2">Анализ от "Учителя"</h4>
    <ul class="list-disc pl-5 space-y-1">
      <li>Укажи на найденный жаргон (если есть)</li>
      <li>Логические пробелы (если есть)</li>
      <li>Совет, как улучшить объяснение</li>
    </ul>
  </div>
</div>

Finally, estimate a "Simplicity Score" out of 10. (10 = a 5-year-old would get it, 1 = read like a textbook).

Output ONLY a JSON object with this exact structure:
{
  "feedback": "the raw HTML string starting with <div class='space-y-4'>...",
  "score": 8
}
`;

        const result = await generateContentWithFallback(`System Prompt: ${systemPrompt}\n\nExplanation:\n${explanation}`, { responseMimeType: "application/json" });
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error("No response from Gemini");
        }

        const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
        const parsedResponse = JSON.parse(cleanJson);

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        let numericScore = parseFloat(String(parsedResponse.score).replace(/[^0-9.]/g, ''));
        if (isNaN(numericScore)) numericScore = 0;

        await prisma.practiceLog.create({
            data: {
                userId: user.id,
                module: category.toLowerCase().includes('english') ? 'english' : category.toLowerCase().includes('german') ? 'german' : 'general',
                type: "feynman",
                topic: concept,
                userInput: explanation,
                score: numericScore,
                aiFeedback: parsedResponse.feedback
            }
        });

        trackEvent(EVENTS.FEYNMAN_SUBMITTED, user.id, { topic: concept, score: numericScore });

        return NextResponse.json({
            feedback: parsedResponse.feedback,
            score: parsedResponse.score,
        });
    } catch (error: any) {
        console.error("[Feynman] API Error:", error);
        const userMessage = error instanceof GeminiError
            ? error.userMessage
            : (error.message || "Ошибка обработки объяснения.");
        const statusCode = error instanceof GeminiError ? error.statusCode : 500;
        return NextResponse.json({ error: userMessage }, { status: statusCode });
    }
}
