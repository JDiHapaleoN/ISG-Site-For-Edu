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

    const { prompt, language, text, type } = await req.json();

    const supabase = createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const user = await ensurePrismaUser(supabaseUser);
    if (!user) {
      return NextResponse.json({ error: "User sync failed" }, { status: 500 });
    }

    if (!prompt || !language || !text || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = `
You are an expert examiner for ${language === "english" ? "IELTS Academic" : "Goethe-Zertifikat"} writing.
The student is attempting "${type}".
The prompt given to the student was: "${prompt}"

Act as a strict but encouraging examiner. Your output MUST be in Russian, as the student's L1 is Russian.
However, you can quote the student's essay in its original language to point out mistakes.

Please provide your evaluation in the following structure using HTML tags for formatting.
Ensure it is safe to display via dangerouslySetInnerHTML.

<div class="space-y-6">
  <div>
    <h4 class="text-lg font-bold mb-2">Общая оценка</h4>
    <p>Абзац с общей оценкой эссе, насколько оно отвечает заданию и насколько хорошо написано.</p>
  </div>
  
  <div>
    <h4 class="text-lg font-bold mb-2">Грамматика и Лексика</h4>
    <ul class="list-disc pl-5 space-y-2">
      <li>Укажите 2-3 конкретные ошибки (цитата -> исправление).</li>
      <li>Отметьте удачное использование сложных конструкций.</li>
    </ul>
  </div>

  <div>
    <h4 class="text-lg font-bold mb-2">Структура и Когезия</h4>
    <p>Оцените логику абзацев, связки и раскрытие темы.</p>
  </div>
</div>

Finally, estimate a score/band:
For IELTS, give a Band score (e.g., 6.5, 7.0).
For TestDaF, give a TDN score (e.g., TDN 3, 4, 5).

Output ONLY a JSON object with this exact structure:
{
  "feedback": "the raw HTML string starting with <div class='space-y-6'>...",
  "score": "6.5" or "TDN 4"
}
`;

    const result = await generateContentWithFallback(`System Prompt: ${systemPrompt}\n\nStudent's essay:\n${text}`, { responseMimeType: "application/json" });
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("No response from Gemini");
    }

    const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    const parsedResponse = JSON.parse(cleanJson);

    // Score extraction (already correct in original)

    // Extract numeric score
    let numericScore = parseFloat(String(parsedResponse.score).replace(/[^0-9.]/g, ''));
    if (isNaN(numericScore)) numericScore = 0;

    await prisma.practiceLog.create({
      data: {
        userId: user.id,
        module: language, // "english" or "german"
        type: type, // "Task 1" etc
        score: numericScore,
        topic: prompt,
        userInput: text,
        aiFeedback: parsedResponse.feedback
      }
    });

    trackEvent(EVENTS.WRITING_SUBMITTED, user.id, { language, type, score: numericScore });

    return NextResponse.json({
      feedback: parsedResponse.feedback,
      score: parsedResponse.score,
    });
  } catch (error: any) {
    console.error("[Writing] API Error:", error);
    const userMessage = error instanceof GeminiError
      ? error.userMessage
      : (error.message || "Ошибка обработки эссе.");
    const statusCode = error instanceof GeminiError ? error.statusCode : 500;
    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}
