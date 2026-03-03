import { NextResponse } from "next/server";
import { generateContentWithFallback } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            language, // "de" | "en"
            fullName,
            country,
            dateOfBirth,
            currentEducation,
            program,
            university,
            degree,        // Bachelor / Master
            semester,      // e.g. "WS 2026/27"
            gpa,
            strongSubjects,
            achievements,
            workExperience,
            languages,     // language skills
            whyProgram,
            whyCountry,
            careerGoals,
            hobbies,
            softSkills,
            additionalInfo,
        } = body;

        if (!fullName || !program || !university || !language) {
            return NextResponse.json(
                { error: "Необходимо заполнить обязательные поля: Имя, Программа, ВУЗ и Язык" },
                { status: 400 }
            );
        }

        const isEnglish = language === "en";
        const outputLang = isEnglish ? "ENGLISH" : "GERMAN (Deutsch)";

        const systemPrompt = `
CRITICAL INSTRUCTION: You MUST write the ENTIRE letter in ${outputLang}. Every single word of the letter must be in ${outputLang}. DO NOT use any other language. If the output language is ENGLISH, do NOT write a single word in German. If the output language is GERMAN, write everything in German.

You are an expert academic admissions consultant. Write a complete, professional ${isEnglish ? "Motivation Letter / Personal Statement" : "Motivationsschreiben"} for a university application.

STRICT RULES:
1. OUTPUT LANGUAGE: ${outputLang}. This is NON-NEGOTIABLE. Every word must be in ${outputLang}.
2. Formal academic tone appropriate for university admissions.
3. Length: 500-700 words.
4. Structure:
   ${isEnglish ? `- "Dear Admissions Committee," (opening)` : `- "Sehr geehrte Damen und Herren," (Anrede)`}
   - Introduction: Who you are, where you're from, what you're applying for
   - Academic background: Education, GPA, strong subjects
   - Relevant experience: Work, internships, projects, achievements
   - Motivation: Why this specific program, why this university
   - Career vision: How the degree connects to future goals
   - Personal qualities: Soft skills, hobbies that demonstrate character
   ${isEnglish ? `- Professional closing with "Yours sincerely,"` : `- Professioneller Abschluss mit "Mit freundlichen Grüßen,"`}
5. Be specific and personal — avoid clichés like "${isEnglish ? "I have always been passionate about..." : "Ich war schon immer leidenschaftlich an..."}"
6. Sound authentic, like a real motivated student, not robotic AI text.
7. Naturally incorporate all provided details — the more data the applicant gave, the richer the letter should be.

APPLICANT PROFILE:
- Full Name: ${fullName}
- Date of Birth: ${dateOfBirth || "Not specified"}
- Country / City: ${country || "Not specified"}
- Current Education: ${currentEducation || "Not specified"}
- Target Program: ${program}
- Target University: ${university}
- Degree Level: ${degree || "Bachelor"}
- Desired Start Semester: ${semester || "Not specified"}
- GPA / Academic Performance: ${gpa || "Not specified"}
- Strong Subjects: ${strongSubjects || "Not specified"}
- Achievements (olympiads, competitions, certificates): ${achievements || "None specified"}
- Work Experience / Internships / Projects: ${workExperience || "None specified"}
- Language Skills: ${languages || "Not specified"}
- Why this program specifically: ${whyProgram || "Not specified"}
- Why this university / country: ${whyCountry || "Not specified"}
- Career Goals (5-10 years after graduation): ${careerGoals || "Not specified"}
- Soft Skills & Personal Qualities: ${softSkills || "Not specified"}
- Hobbies & Extracurricular Activities: ${hobbies || "Not specified"}
- Additional Information: ${additionalInfo || "None"}

FINAL REMINDER: The ENTIRE letter must be written in ${outputLang}. Not a single sentence in any other language.

OUTPUT: Return ONLY the letter text. No JSON, no markdown formatting, no code blocks, no explanations. Just the pure letter text ready to be copied and sent.
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
