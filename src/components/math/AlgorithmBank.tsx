"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ListChecks, Loader2 } from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { motion, AnimatePresence } from "framer-motion";
import { getAlgorithms } from "@/app/actions/algorithmActions";

export default function AlgorithmBank() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [algorithms, setAlgorithms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAlgorithms().then(data => {
            setAlgorithms(data);
            setIsLoading(false);
        }).catch(console.error);
    }, []);

    const toggle = (id: string) => {
        if (openId === id) setOpenId(null);
        else setOpenId(id);
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" /></div>;
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-2">
                <ListChecks className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-fuchsia-500" />
                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-rose-500">
                    Банк пошаговых алгоритмов
                </h2>
            </div>

            <div className="flex flex-col gap-4">
                {algorithms.map((algo: any) => {
                    const isOpen = openId === algo.id;

                    return (
                        <div
                            key={algo.id}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all"
                        >
                            <button
                                onClick={() => toggle(algo.id)}
                                className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{algo.title}</h3>
                                    <p className="text-zinc-500 text-sm">{algo.description}</p>
                                </div>
                                <div className="flex gap-4 items-center pl-4 shrink-0">
                                    <div className="hidden md:block translate-y-2">
                                        <MathRenderer math={algo.formula} />
                                    </div>
                                    <ChevronDown className={`w-6 h-6 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-zinc-100 dark:border-zinc-800"
                                    >
                                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-4">
                                            {algo.steps.map((step: any, index: number) => (
                                                <div key={index} className="flex gap-4">
                                                    <div className="w-8 h-8 shrink-0 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col gap-2 pt-1 border-b border-zinc-200 dark:border-zinc-800/50 pb-4 w-full">
                                                        <p className="text-zinc-700 dark:text-zinc-300">
                                                            {/* Splitting text by inline math $...$ */}
                                                            {step.text.split(/\\$(.*?)\\$/g).map((part: string, i: number) =>
                                                                i % 2 === 1 ? (
                                                                    <MathRenderer key={i} math={part} className="text-fuchsia-600 dark:text-fuchsia-400 inline-block px-1" />
                                                                ) : (
                                                                    <span key={i}>{part}</span>
                                                                )
                                                            )}
                                                        </p>
                                                        {step.math && (
                                                            <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 mt-2">
                                                                <MathRenderer math={step.math} block />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
