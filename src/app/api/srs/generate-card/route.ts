import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth-sync";
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";
import { generateContentWithFallback, GeminiError } from "@/lib/gemini";

const PROMPT_TEMPLATE = `Ты профессиональный лингвист-преподаватель. Пользователь хочет добавить слово или фразу в свой словарь интервальных повторений (SRS).
Слово/Фраза: "{word}"
Язык: {language}

Создай идеальную карточку для изучения этого слова. Верни РОВНО И ТОЛЬКО валидный JSON объект (без markdown, без \`\`\`json\`\`\`, просто чистый JSON), со следующими ключами:
- "translation": Точный, короткий и самый популярный перевод на русский язык (1-3 слова).
- "context": Короткое, понятное предложение-пример использования на изучаемом языке.
- "transcription": Транскрипция (для английского) ИЛИ артикль (der/die/das для немецкого, если это существительное). Если это не существительное в немецком, верни null.
- "mnemonic": Очень короткая, забавная или жизненная ассоциация для запоминания (до 10 слов).

JSON:`;

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const limit = checkRateLimit(`ai_card:${ip}`, AI_RATE_LIMIT);
        if (!limit.allowed) {
            return NextResponse.json(
                { error: `Слишком много запросов к ИИ. Подождите ${Math.ceil(limit.resetMs / 1000)} сек.` },
                { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
            );
        }

        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (!supabaseUser) {
            return NextResponse.json({ error: "Auth required" }, { status: 401 });
        }

        const user = await ensurePrismaUser(supabaseUser);
        if (!user) {
            return NextResponse.json({ error: "User sync failed" }, { status: 500 });
        }

        const { word, module } = await req.json();

        if (!word || !module) {
            return NextResponse.json({ error: "Word and module are required" }, { status: 400 });
        }

        const language = module === "german" ? "Немецкий" : "Английский";
        const prompt = PROMPT_TEMPLATE.replace("{word}", word).replace("{language}", language);

        const aiResult: any = await generateContentWithFallback(prompt, { responseMimeType: "application/json" });
        const textResult = typeof aiResult.response?.text === 'function' ? aiResult.response.text() : aiResult.response?.text || "";

        let parsedResult;
        try {
            // Clean up potentially malformed JSON output (remove markdown blocks if AI ignored instructions)
            const cleanJson = textResult.replace(/```json/gi, "").replace(/```/g, "").trim();
            parsedResult = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse AI JSON:", textResult);
            return NextResponse.json({ error: "ИИ вернул неверный формат данных. Попробуйте снова." }, { status: 500 });
        }

        return NextResponse.json(parsedResult);
    } catch (error: any) {
        console.error("[generate-card route.ts] Error:", error);

        const userMessage = error instanceof GeminiError
            ? error.userMessage
            : (error.message || "Внутренняя ошибка сервера");
        const statusCode = error instanceof GeminiError ? error.statusCode : 500;

        return NextResponse.json({ error: userMessage }, { status: statusCode });
    }
}
