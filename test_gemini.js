const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.OPENAI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = `
You are simulating a 12-year-old student who is very curious but doesn't know any advanced jargon. 
The user is trying to explain the concept of "Производная (Calculus)" (Category: Математика) to you using the Feynman Technique.

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

        console.log("Sending request...");
        const result = await model.generateContent(`System Prompt: ${systemPrompt}\n\nExplanation:\nпроизводная а дальше можешь решить как уравнение или что то другое`);
        console.log("Raw response text:");
        const text = result.response.text();
        console.log(text);

        // Test parsing
        const cleanJson = text.replace(/```json\n?|```/g, "").trim();
        const parsedResponse = JSON.parse(cleanJson);
        console.log("\nParsed successfully:", !!parsedResponse.feedback);
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
