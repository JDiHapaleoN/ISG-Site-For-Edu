import { NextResponse } from "next/server";
import { generateContentWithFallback } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            language, // "de" | "en"
            fullName,
            country,
            program,     // e.g. "Informatik", "Maschinenbau"
            university,  // e.g. "TU München"
            gpa,
            strongSubjects,
            achievements, // олимпиады, стажировки
            whyProgram,
            whyCountry,
            careerGoals,
            hobbies,
            additionalInfo,
        } = body;

        if (!fullName || !program || !university || !language) {
            return NextResponse.json(
                { error: "Необходимо заполнить обязательные поля: Имя, Программа, ВУЗ и Язык" },
                { status: 400 }
            );
        }

        const langLabel = language === "de" ? "German (formal academic Deutsch)" : "English (formal academic English)";
        const letterType = language === "de" ? "Motivationsschreiben" : "Motivation Letter / Personal Statement";

        const systemPrompt = `
You are a world-class academic admissions consultant who specializes in writing ${letterType} for university applications in ${language === "de" ? "Germany" : "Europe/USA"}.

Write a complete, polished, and professional ${letterType} in ${langLabel} based on the applicant's profile below.

RULES:
1. The letter MUST be written in ${langLabel}. This is critical.
2. Use formal academic tone appropriate for university admissions.
3. The letter should be 400-600 words long.
4. Structure: 
   - Opening (introduce yourself and state your intention)
   - Academic background and achievements
   - Motivation for the specific program and university
   - Career goals and how this program fits
   - Strong closing paragraph
5. Do NOT use generic phrases like "I have always been passionate about...". Be specific and personal.
6. Make it sound authentic — like a real student wrote it, not an AI.
7. If the applicant provided hobbies or extra info, weave them naturally into the narrative.
${language === "de" ? '8. Use proper German formal letter conventions (Sehr geehrte Damen und Herren, etc.).' : '8. Use proper formal letter conventions (Dear Admissions Committee, etc.).'}

APPLICANT PROFILE:
- Full Name: ${fullName}
- Country of Origin: ${country || "Not specified"}
- Target Program: ${program}
- Target University: ${university}
- GPA / Academic Performance: ${gpa || "Not specified"}
- Strong Subjects: ${strongSubjects || "Not specified"}
- Achievements (olympiads, internships, projects): ${achievements || "None specified"}
- Why this program: ${whyProgram || "Not specified"}
- Why this country/university: ${whyCountry || "Not specified"}
- Career Goals: ${careerGoals || "Not specified"}
- Hobbies & Interests: ${hobbies || "Not specified"}
- Additional Information: ${additionalInfo || "None"}

OUTPUT: Return ONLY the letter text. No JSON wrapping, no markdown, no explanations — just the pure letter text ready to be copied.
`;

        const result = await generateContentWithFallback(systemPrompt);
        const letterText = result.response.text();

        if (!letterText || letterText.trim().length < 50) {
            return NextResponse.json(
                { error: "ИИ не смог сгенерировать письмо. Попробуйте ещё раз." },
                { status: 500 }
            );
        }

        return NextResponse.json({ letter: letterText.trim() });

    } catch (error: any) {
        console.error("[Motivation Letter API Error]", error);
        return NextResponse.json(
            { error: error.message || "Не удалось сгенерировать мотивационное письмо." },
            { status: 500 }
        );
    }
}
