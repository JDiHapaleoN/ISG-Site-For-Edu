import MathGlossary from "@/components/math/MathGlossary";
import MathErrorLog from "@/components/math/MathErrorLog";
import AlgorithmBank from "@/components/math/AlgorithmBank";
import { Sigma } from "lucide-react";

export const metadata = {
    title: "Math Hub | Antigravity LMS",
    description: "Trilingual Math Glossary and Error Log",
};

export default function MathPage() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col pt-12 gap-16">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-4">
                    <Sigma className="w-12 h-12 text-indigo-500" />
                    Математика и Логика
                </h1>
                <p className="text-zinc-500 text-lg max-w-2xl">
                    Изучайте продвинутые методы решения математических задач. Трехъязычный словарь и банк алгоритмов для подготовки к международным экзаменам.
                </p>
            </div>

            <MathGlossary />

            <div className="max-w-6xl mx-auto w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            <AlgorithmBank />

            <div className="max-w-6xl mx-auto w-full h-px bg-zinc-200 dark:bg-zinc-800" />

            <MathErrorLog />

            <div className="pb-20" />
        </main>
    );
}
