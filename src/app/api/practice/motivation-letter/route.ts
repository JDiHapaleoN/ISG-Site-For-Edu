import { NextResponse } from "next/server";
import { generateContentWithFallback } from "@/lib/gemini";
import { motivationLetterSchema } from "@/lib/validations";
import { sanitizeForLlm } from "@/lib/sanitize";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validate with Zod
        const parsed = motivationLetterSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const {
            language,
            fullName,
            country,
            dateOfBirth,
            currentEducation,
            program,
            university,
            degree,
            semester,
            gpa,
            strongSubjects,
            achievements,
            workExperience,
            languages,
            whyProgram,
            whyCountry,
            careerGoals,
            hobbies,
            softSkills,
            additionalInfo,
        } = parsed.data;

        // 2. Sanitize all user-provided text before LLM interpolation
        const s = sanitizeForLlm;

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
- Full Name: ${s(fullName)}
- Date of Birth: ${s(dateOfBirth) || "Not specified"}
- Country / City: ${s(country) || "Not specified"}
- Current Education: ${s(currentEducation) || "Not specified"}
- Target Program: ${s(program)}
- Target University: ${s(university)}
- Degree Level: ${s(degree) || "Bachelor"}
- Desired Start Semester: ${s(semester) || "Not specified"}
- GPA / Academic Performance: ${s(gpa) || "Not specified"}
- Strong Subjects: ${s(strongSubjects) || "Not specified"}
- Achievements (olympiads, competitions, certificates): ${s(achievements) || "None specified"}
- Work Experience / Internships / Projects: ${s(workExperience) || "None specified"}
- Language Skills: ${s(languages) || "Not specified"}
- Why this program specifically: ${s(whyProgram) || "Not specified"}
- Why this university / country: ${s(whyCountry) || "Not specified"}
- Career Goals (5-10 years after graduation): ${s(careerGoals) || "Not specified"}
- Soft Skills & Personal Qualities: ${s(softSkills) || "Not specified"}
- Hobbies & Extracurricular Activities: ${s(hobbies) || "Not specified"}
- Additional Information: ${s(additionalInfo) || "None"}

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
        console.error("[Motivation Letter] API Error:", error);
        return NextResponse.json(
            { error: error.message || "Не удалось сгенерировать мотивационное письмо." },
            { status: 500 }
        );
    }
}
