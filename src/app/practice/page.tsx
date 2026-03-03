import WritingSimulator from "@/components/practice/WritingSimulator";
import FeynmanSimulator from "@/components/practice/FeynmanSimulator";
import MotivationLetterGenerator from "@/components/practice/MotivationLetterGenerator";
import { PenTool } from "lucide-react";

export const metadata = {
    title: "AI Practice Zone | Antigravity LMS",
    description: "IELTS & TestDaF writing simulators, and Feynman Technique practice.",
};

export default function PracticePage() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 flex flex-col gap-16">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-4">
                    <PenTool className="w-12 h-12 text-sky-500" />
                    Тренажеры ИИ
                </h1>
                <p className="text-zinc-500 text-lg max-w-2xl">
                    Применяйте знания в условиях, приближенных к экзаменационным. Получайте мгновенную и подробную обратную связь от ИИ.
                </p>
            </div>

            <WritingSimulator />

            <div className="max-w-6xl mx-auto w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            <FeynmanSimulator />

            <div className="max-w-6xl mx-auto w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            <MotivationLetterGenerator />

            <div className="pb-20" />
        </main>
    );
}
