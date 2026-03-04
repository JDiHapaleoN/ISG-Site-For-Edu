"use client";

import { useState } from "react";
import { RedemittelCategory } from "@/lib/speaking-data";
import { BookOpen, ChevronRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    categories: RedemittelCategory[];
    module: "english" | "german";
}

export default function RedemittelLibrary({ categories, module }: Props) {
    const [activeTab, setActiveTab] = useState(categories[0].id);

    return (
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    {module === "english" ? "Speaking Templates (Redemittel)" : "Redemittel-Bibliothek"}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    {module === "english"
                        ? "Master these phrases to improve your coherence and Lexical Resource score."
                        : "Lerne diese Ausdrücke, um deine argumentative Struktur und Ausdrucksweise zu verbessern."}
                </p>
            </div>

            <div className="flex overflow-x-auto p-2 gap-1 bg-zinc-100/50 dark:bg-zinc-800/30">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === cat.id
                                ? "bg-white dark:bg-zinc-700 text-indigo-500 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {categories.find(c => c.id === activeTab)?.phrases.map((p, idx) => (
                            <div
                                key={idx}
                                className="group p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">
                                            {p.phrase}
                                        </p>
                                        <p className="text-sm text-zinc-500 italic">
                                            {p.translation}
                                        </p>
                                    </div>
                                    <button className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors">
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
