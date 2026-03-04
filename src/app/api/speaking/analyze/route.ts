import { NextResponse } from "next/server";
import { generateContentWithFallback, GeminiError } from "@/lib/gemini";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { transcript, topic, module, targetPhrases } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const systemPrompt = `
You are an expert ${module === "english" ? "IELTS" : "Goethe-Zertifikat"} Speaking Examiner.
A student gave the following answer to this topic: "${topic}"

Student's Transcript:
"${transcript}"

The student was encouraged to use these target phrases (Redemittel):
${targetPhrases.join(", ")}

Analyze the response according to ${module === "english" ? "IELTS" : "Goethe-Zertifikat"} criteria:
1. Fluency and Coherence (How natural and well-structured is the speech?)
2. Lexical Resource (Usage of advanced vocabulary and the target phrases)
3. Grammatical Range and Accuracy

Provide:
- An overall score (0.0 to 9.0 for IELTS, 0 to 100 Punkte for Goethe-Zertifikat)
- "Specific Feedback": What was good and what to improve.
- "Phrase Usage": List which target phrases were used correctly and which were missed.

Output MUST be a JSON object:
{
  "score": "7.5",
  "feedback": "Your answer was very fluid, but...",
  "phraseAnalysis": [
    { "phrase": "To begin with", "used": true, "comment": "Excellent opening." },
    { "phrase": "Meiner Meinung nach", "used": false, "comment": "Try using this to state your main point." }
  ]
}

REPLY IN RUSSIAN for the feedback parts.
`;

    const result = await generateContentWithFallback(systemPrompt, { responseMimeType: "application/json" });
    const analysis = JSON.parse(result.response.text());

    // Track analytics
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    trackEvent("speaking_analyzed", user?.id, { module, score: analysis.score });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("[Speaking Analysis] Error:", error);
    return NextResponse.json({ error: "Failed to analyze speech" }, { status: 500 });
  }
}
