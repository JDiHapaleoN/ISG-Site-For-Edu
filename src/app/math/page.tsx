import dynamic from 'next/dynamic';
import { Sigma } from "lucide-react";

const MathGlossary = dynamic(() => import("@/components/math/MathGlossary"), { ssr: false });
const MathErrorLog = dynamic(() => import("@/components/math/MathErrorLog"), { ssr: false });
const AlgorithmBank = dynamic(() => import("@/components/math/AlgorithmBank"), { ssr: false });

export const metadata = {
    title: "Math Hub | Antigravity LMS",
    description: "Trilingual Math Glossary and Error Log",
};

export default function MathPage() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 flex flex-col gap-16">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
                    <Sigma className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 text-indigo-500" />
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
