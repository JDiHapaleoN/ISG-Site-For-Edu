"use client";

import { useState, useEffect, useMemo } from "react";
import { MessageSquare, Send, RefreshCcw, Loader2, BrainCircuit, Lightbulb, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONCEPTS = [
    { id: "c1", category: "Математика", title: "Производная (Calculus)" },
    { id: "c2", category: "Математика", title: "Теорема Пифагора" },
    { id: "c3", category: "Математика", title: "Логарифмы" },
    { id: "c4", category: "Математика", title: "Теорема Синусов" },
    { id: "c5", category: "Математика", title: "Теорема Косинусов" },
    { id: "c6", category: "Математика", title: "Квадратные уравнения" },
    { id: "c7", category: "Математика", title: "Свойства степеней" },
    { id: "c8", category: "Математика", title: "Тригонометрическое тождество" }
];

export default function FeynmanSimulator() {
    // Daily Logic
    const dailyPrompt = useMemo(() => {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        return CONCEPTS[seed % CONCEPTS.length];
    }, []);

    const [activeConcept, setActiveConcept] = useState(dailyPrompt);
    const [text, setText] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [simplicityScore, setSimplicityScore] = useState<number | null>(null);

    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    const handleSubmit = async () => {
        if (wordCount < 10) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/practice/feynman", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    concept: activeConcept.title,
                    category: activeConcept.category,
                    explanation: text
                })
            });

            if (res.ok) {
                const data = await res.json();
                setFeedback(data.feedback);
                setSimplicityScore(data.score);
            }
        } catch (error) {
            console.error(error);
            setFeedback("Не удалось обработать объяснение. Пожалуйста, попробуйте снова.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetSimulation = () => {
        setText("");
        setFeedback(null);
        setSimplicityScore(null);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm w-full flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BrainCircuit className="w-8 h-8 text-fuchsia-500" />
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-rose-500">
                            Техника Фейнмана
                        </h2>
                    </div>
                    <p className="text-zinc-500 text-sm max-w-xl">
                        Объясните сложную концепцию как можно проще. ИИ будет выступать в роли 12-летнего ученика.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0 min-w-0">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-100 dark:border-fuchsia-900/30 rounded-xl text-fuchsia-600 dark:text-fuchsia-400 text-sm font-bold shrink-0">
                        <Calendar className="w-4 h-4" />
                        Тема дня
                    </div>

                    <select
                        className="flex-1 px-4 py-3 sm:py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-500 w-full overflow-hidden text-ellipsis whitespace-nowrap min-w-0"
                        value={activeConcept.id}
                        onChange={(e) => {
                            const c = CONCEPTS.find(c => c.id === e.target.value);
                            if (c) {
                                setActiveConcept(c);
                                resetSimulation();
                            }
                        }}
                    >
                        {CONCEPTS.map(c => (
                            <option key={c.id} value={c.id}>[{c.category}] {c.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px]">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-zinc-900 dark:text-zinc-100">
                        <span className="font-semibold">Ваше объяснение</span>
                        <span className={`text-sm font-bold ${wordCount < 10 ? 'text-rose-500' : 'text-fuchsia-500'}`}>
                            {wordCount} слов
                        </span>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isSubmitting || !!feedback}
                        placeholder={`Объясните "${activeConcept.title}" максимально просто...`}
                        className="flex-1 w-full p-8 resize-none focus:outline-none bg-transparent text-zinc-900 dark:text-zinc-100 text-lg leading-relaxed font-serif disabled:opacity-50"
                    />

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                        <button
                            onClick={resetSimulation}
                            disabled={isSubmitting || (!text && !feedback)}
                            className="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={wordCount < 10 || isSubmitting || !!feedback}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:opacity-90 text-white font-bold rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-fuchsia-500/20"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Анализ...</>
                            ) : (
                                <><Send className="w-5 h-5" /> Обучить ученика</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px] relative">
                    {!feedback ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                <MessageSquare className="w-20 h-20 mb-6 opacity-50 text-fuchsia-500" />
                            </motion.div>
                            <p className="text-xl font-bold text-zinc-600 dark:text-zinc-400">Представьте, что перед вами ребенок.</p>
                            <p className="text-sm mt-4 max-w-sm leading-relaxed">
                                Расскажите о концепции **"{activeConcept.title}"** простыми словами без терминов.
                                ИИ проверит вашу логику и простоту.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col h-full w-full"
                            >
                                <div className="p-8 bg-fuchsia-50 dark:bg-fuchsia-950/30 border-b border-fuchsia-100 dark:border-fuchsia-900/30 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-2xl flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
                                            <Lightbulb className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-none">Вердикт ученика</h3>
                                            <p className="text-fuchsia-600/80 font-bold text-xs uppercase tracking-widest mt-1">Оценка по системе Фейнмана</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-800 px-5 py-3 rounded-2xl shadow-sm border border-fuchsia-100 dark:border-fuchsia-800 flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-tighter">Простота</span>
                                        <span className="text-3xl font-black text-fuchsia-600 dark:text-fuchsia-400">{simplicityScore}/10</span>
                                    </div>
                                </div>

                                <div className="flex-1 p-8 overflow-y-auto w-full prose prose-zinc dark:prose-invert max-w-none scroll-smooth">
                                    <div
                                        className="evaluate-html-content"
                                        dangerouslySetInnerHTML={{ __html: feedback.replace(/\\n/g, '<br/>') }}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
