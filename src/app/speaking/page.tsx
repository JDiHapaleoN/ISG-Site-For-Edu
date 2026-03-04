import SpeakingSimulator from "@/components/speaking/SpeakingSimulator";
import RedemittelLibrary from "@/components/speaking/RedemittelLibrary";
import {
    SPEAKING_TEMPLATES_EN,
    SPEAKING_TEMPLATES_DE,
    SPEAKING_TOPICS_EN,
    SPEAKING_TOPICS_DE
} from "@/lib/speaking-data";
import { MessageSquare, BadgeCheck } from "lucide-react";

export const metadata = {
    title: "Speaking Coach | Antigravity LMS",
    description: "IELTS & Goethe speaking simulator with exam-ready templates.",
};

export default function SpeakingPage({
    searchParams,
}: {
    searchParams: { lang?: string };
}) {
    const module = searchParams.lang === "german" ? "german" : "english";
    const templates = module === "german" ? SPEAKING_TEMPLATES_DE : SPEAKING_TEMPLATES_EN;
    const topics = module === "german" ? SPEAKING_TOPICS_DE : SPEAKING_TOPICS_EN;

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                            Speaking Coach
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                                AI Powered
                            </span>
                        </h1>
                        <p className="text-zinc-500 max-w-2xl text-lg">
                            {module === "english"
                                ? "Practice your IELTS speaking with high-scoring structures and real-time AI feedback."
                                : "Trainiere deine Goethe-Sprechfertigkeiten mit Redemitteln und KI-Feedback."}
                        </p>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-2xl shadow-inner w-full md:w-auto">
                        <a
                            href="?lang=english"
                            className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-center ${module === "english"
                                ? "bg-white dark:bg-zinc-700 text-indigo-500 shadow-sm scale-[1.02]"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                }`}
                        >
                            IELTS (English)
                        </a>
                        <a
                            href="?lang=german"
                            className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-center ${module === "german"
                                ? "bg-white dark:bg-zinc-700 text-indigo-500 shadow-sm scale-[1.02]"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                }`}
                        >
                            Goethe (Deutsch)
                        </a>
                    </div>
                </div>

                {/* Main Content: Simulator & Stats Panel */}
                <SpeakingSimulator topics={topics} categories={templates} module={module} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left 2/3: The Library */}
                    <div className="xl:col-span-2">
                        <RedemittelLibrary categories={templates} module={module} />
                    </div>

                    {/* Right 1/3: Tips / Score Explanation */}
                    <div className="space-y-8">
                        <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-indigo-400" />
                                {module === "english" ? "Scoring Tips" : "Erfolgtipps"}
                            </h3>
                            <div className="space-y-4 text-zinc-400 text-sm">
                                <p>
                                    <strong className="text-white">Coherence:</strong> {module === "english" ? "Use linking words to connect your ideas logically." : "Verwende Konnektoren, um deine Gedanken logisch zu verknüpfen."}
                                </p>
                                <p>
                                    <strong className="text-white">Vocabulary:</strong> {module === "english" ? "Avoid repeating the same words. Use the templates below." : "Vermeide Wortwiederholungen. Nutze die Redemittel unten."}
                                </p>
                                <p>
                                    <strong className="text-white">Fluency:</strong> {module === "english" ? "Don't worry too much about mistakes. Keep talking!" : "Mache dir keine Sorgen um Fehler. Rede einfach weiter!"}
                                </p>
                            </div>
                        </div>

                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-900">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-zinc-400" />
                                Need Help?
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Записывайте свою речь, и ИИ проверит её на соответствие критериям экзамена. Если у вас нет микрофона, вы можете использовать Web Speech API в поддерживаемых браузерах (Chrome/Safari/Edge).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
