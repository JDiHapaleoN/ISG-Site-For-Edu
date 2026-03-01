"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, PlusCircle, Check, Loader2, Highlighter } from "lucide-react";

export interface WordData {
    term: string;
    translation?: string;
    contextTranslation?: string;
    mnemonic?: string;
    partOfSpeech?: string;
    // English only
    transcription?: string;
    // German only
    article?: string;
    pluralForm?: string;

    // UI state
    context?: string;
    isAdded?: boolean;
}

interface ReaderProps {
    initialText: string;
    module: "english" | "german";
}

export default function InteractiveReader({ initialText, module }: ReaderProps) {
    const [customText, setCustomText] = useState(initialText);
    const [isEditing, setIsEditing] = useState(initialText === "");
    const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [highlights, setHighlights] = useState<Set<number>>(new Set());
    const [isHighlightMode, setIsHighlightMode] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);

    // Simple tokenization retaining spaces/punctuation in the array for rendering
    // We use regex to split keeping word characters grouped, supporting Unicode (Umlauts etc)
    const words = customText.split(/([^\p{L}\p{N}]+)/u).filter(Boolean);

    const handleWordClick = async (chunk: string, index: number) => {
        if (isHighlightMode) {
            setHighlights(prev => {
                const next = new Set(prev);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
            });
            return;
        }

        const cleanWord = chunk.trim().replace(/[.,!?;()":]/g, "");
        if (!cleanWord || !/[\p{L}\p{N}]/u.test(cleanWord)) return;

        setIsTranslating(true);
        setTranslationError(null);

        // Extract context sentence more reliably
        const textToSearch = customText;
        const startIdx = textToSearch.indexOf(chunk);
        let context = chunk;
        if (startIdx !== -1) {
            const before = textToSearch.substring(0, startIdx).split(/[.!?]/).pop() || "";
            const after = textToSearch.substring(startIdx + chunk.length).split(/[.!?]/)[0] || "";
            context = (before + chunk + after).trim() + ".";
        }

        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: cleanWord, context, module }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Ошибка перевода");
            }
            const data = await res.json();

            setSelectedWord({ ...data, context, isAdded: data.isAdded || false });
        } catch (err: any) {
            console.error(err);
            setTranslationError(err.message || "Не удалось загрузить перевод. Пожалуйста, проверьте соединение.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleAddToSRS = async () => {
        if (!selectedWord || selectedWord.isAdded || isAdding) return;
        setIsAdding(true);

        try {
            // In a real app we'd get userId from auth session
            const res = await fetch("/api/srs/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wordData: selectedWord, module }),
            });

            if (res.ok) {
                setSelectedWord({ ...selectedWord, isAdded: true });
            } else {
                console.error("Failed to add to SRS");
            }
        } catch (error) {
            console.error("SRS API error", error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto h-[calc(100vh-120px)] p-4">
            {/* Reader Pane */}
            <div className="flex-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 overflow-y-auto shadow-2xl transition-all flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3 font-sans">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        Текст ({module === 'german' ? 'Немецкий' : 'Английский'})
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsHighlightMode(!isHighlightMode)}
                                className={`p-2 rounded-xl transition-all ${isHighlightMode
                                    ? 'bg-yellow-400 text-yellow-950 shadow-inner'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    }`}
                                title="Режим хайлайтера"
                            >
                                <Highlighter className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (isEditing) {
                                    // Auto-correct spacing and clean up text
                                    const cleaned = customText
                                        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
                                        .replace(/[ \t]+/g, ' ')    // collapse spaces
                                        .trim();
                                    setCustomText(cleaned);
                                }
                                setIsEditing(!isEditing);
                            }}
                            className="text-sm font-bold px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-opacity font-sans"
                        >
                            {isEditing ? 'Готово (Читать)' : 'Вставить свой текст'}
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    <textarea
                        className="w-full flex-1 min-h-[400px] p-4 bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl resize-none font-serif text-lg leading-loose focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Вставьте сюда свой текст для изучения..."
                    />
                ) : (
                    <div className="text-xl leading-[1.8] text-zinc-800 dark:text-zinc-200 font-serif tracking-wide select-text">
                        {words.map((chunk, i) => {
                            const isWord = /[\p{L}\p{N}]/u.test(chunk);
                            const isHighlighted = highlights.has(i);
                            if (!isWord) return <span key={i} className="whitespace-pre-wrap">{chunk}</span>;

                            return (
                                <motion.span
                                    key={i}
                                    whileHover={{ backgroundColor: isHighlightMode ? "rgba(250, 204, 21, 0.4)" : "rgba(99, 102, 241, 0.2)", borderRadius: "4px" }}
                                    className={`cursor-pointer transition-all px-0.5 mx-[-0.125rem] rounded-[4px] ${isHighlighted
                                        ? "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-950 dark:text-yellow-100 shadow-[0_0_0_1px_rgba(250,204,21,0.5)]"
                                        : ""
                                        }`}
                                    onClick={() => handleWordClick(chunk, i)}
                                >
                                    {chunk}
                                </motion.span>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Dictionary / SRS Info Pane */}
            <AnimatePresence>
                {(selectedWord || isTranslating || translationError) && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full md:w-80 h-fit bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 sticky top-4 font-sans"
                    >
                        {isTranslating ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium animate-pulse">Анализ контекста...</p>
                            </div>
                        ) : translationError ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500">
                                    <PlusCircle className="w-6 h-6 rotate-45" />
                                </div>
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{translationError}</p>
                                <button
                                    onClick={() => {
                                        setTranslationError(null);
                                        setSelectedWord(null);
                                    }}
                                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline"
                                >
                                    Закрыть
                                </button>
                            </div>
                        ) : selectedWord ? (
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {selectedWord.article && (
                                                <span className="text-pink-500 font-bold text-xl">{selectedWord.article}</span>
                                            )}
                                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                                                {selectedWord.term}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedWord.transcription && (
                                                <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
                                                    [{selectedWord.transcription}]
                                                </p>
                                            )}
                                            {selectedWord.pluralForm && (
                                                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
                                                    Мн.ч. {selectedWord.pluralForm}
                                                </p>
                                            )}
                                            {selectedWord.partOfSpeech && (
                                                <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase">
                                                    {selectedWord.partOfSpeech}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                        <Volume2 className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-2">
                                        Перевод
                                    </p>
                                    <p className="text-xl font-medium dark:text-zinc-100">
                                        {selectedWord.translation}
                                    </p>
                                </div>

                                {selectedWord.mnemonic && (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">💡 Мнемоника</p>
                                        <p className="text-sm text-amber-900 dark:text-amber-100">
                                            {selectedWord.mnemonic}
                                        </p>
                                    </div>
                                )}

                                {selectedWord.contextTranslation && (
                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-2">
                                        <p className="text-sm text-indigo-900 dark:text-indigo-200 font-serif">
                                            "{selectedWord.context}"
                                        </p>
                                        <div className="w-full h-px border-t border-dashed border-indigo-200 dark:border-indigo-800" />
                                        <p className="text-sm text-indigo-800 dark:text-indigo-300 italic">
                                            {selectedWord.contextTranslation}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleAddToSRS}
                                    disabled={selectedWord.isAdded || isAdding}
                                    className={`mt-2 w-full py-3 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${selectedWord.isAdded
                                        ? "bg-emerald-500 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                                        }`}
                                >
                                    {isAdding ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : selectedWord.isAdded ? (
                                        <>
                                            <Check className="w-5 h-5" /> Уже в словаре
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="w-5 h-5" /> Добавить в словарь
                                        </>
                                    )}
                                </button>
                            </>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
