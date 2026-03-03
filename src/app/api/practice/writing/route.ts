import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";

export async function POST(req: Request) {
  try {
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
You are an expert examiner for ${language === "english" ? "IELTS Academic" : "TestDaF"} writing.
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

    const result = await geminiModel.generateContent(`System Prompt: ${systemPrompt}\n\nStudent's essay:\n${text}`);
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

    return NextResponse.json({
      feedback: parsedResponse.feedback,
      score: parsedResponse.score,
    });
  } catch (error: any) {
    console.error("Gemini writing error:", error);

    if (error.message?.includes("429") || error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Превышен лимит запросов. Пожалуйста, подождите 1-2 минуты." },
        { status: 429 }
      );
    }

    if (error.message?.includes("503") || error.message?.includes("overloaded")) {
      return NextResponse.json(
        { error: "Сервера перегружены. Пожалуйста, попробуйте снова через 30 секунд." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: `Failed to process essay: ${error.message}` }, { status: 500 });
  }
}
