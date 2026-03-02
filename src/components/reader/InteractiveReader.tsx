"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, PlusCircle, Check, Loader2, Highlighter, X } from "lucide-react";

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
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 w-full max-w-6xl mx-auto min-h-[calc(100vh-80px)] lg:h-[calc(100vh-120px)] p-2 md:p-4">
            {/* Reader Pane */}
            <div className="flex-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 md:p-8 overflow-y-auto shadow-2xl transition-all flex flex-col min-h-[400px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 font-sans">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                        Текст ({module === 'german' ? 'DE' : 'EN'})
                    </h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!isEditing && (
                            <button
                                onClick={() => setIsHighlightMode(!isHighlightMode)}
                                className={`p-2.5 rounded-xl transition-all ${isHighlightMode
                                    ? 'bg-yellow-400 text-yellow-950 shadow-inner'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    }`}
                                title="Режим хайлайтера"
                            >
                                <Highlighter className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={async () => {
                                if (isEditing) {
                                    const cleaned = customText
                                        .replace(/\n{3,}/g, '\n\n')
                                        .replace(/[ \t]+/g, ' ')
                                        .trim();
                                    setCustomText(cleaned);
                                    try {
                                        await fetch('/api/reader/persistence', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ text: cleaned, module })
                                        });
                                    } catch (e) {
                                        console.error("Failed to persist reader text", e);
                                    }
                                }
                                setIsEditing(!isEditing);
                            }}
                            className="flex-1 sm:flex-none text-xs md:text-sm font-bold px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-opacity font-sans"
                        >
                            {isEditing ? 'Готово (Читать)' : 'Свой текст'}
                        </button>
                    </div>
                </div>

                {!isEditing && customText && (
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={async () => {
                                setIsAdding(true);
                                try {
                                    const title = customText.substring(0, 30).trim() + "...";
                                    const res = await fetch('/api/reader/save', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title, content: customText, module })
                                    });
                                    if (res.ok) {
                                        alert("Текст сохранен в вашем профиле! ✨");
                                    }
                                } catch (e) {
                                    alert("Ошибка при сохранении");
                                } finally {
                                    setIsAdding(false);
                                }
                            }}
                            className="text-[10px] md:text-xs font-bold px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/20 flex items-center gap-2"
                        >
                            {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                            Сохранить в профиль
                        </button>
                    </div>
                )}

                {isEditing ? (
                    <textarea
                        className="w-full flex-1 min-h-[300px] md:min-h-[400px] p-4 lg:p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl resize-none font-sans text-base md:text-lg lg:text-xl leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Вставьте сюда свой текст для изучения..."
                    />
                ) : (
                    <div className="text-lg md:text-xl leading-[1.8] text-zinc-800 dark:text-zinc-200 font-serif tracking-wide select-text pb-20 lg:pb-0">
                        {words.map((chunk, i) => {
                            const isWord = /[\p{L}\p{N}]/u.test(chunk);
                            const isHighlighted = highlights.has(i);
                            if (!isWord) return <span key={i} className="whitespace-pre-wrap">{chunk}</span>;

                            return (
                                <motion.span
                                    key={i}
                                    whileTap={{ scale: 0.95 }}
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
                        initial={{ opacity: 0, y: 100, x: 0 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 100, x: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-10 lg:w-80 h-fit max-h-[80vh] bg-white dark:bg-zinc-900 lg:bg-white/80 lg:dark:bg-zinc-900/80 backdrop-blur-2xl border-t lg:border border-zinc-200 dark:border-zinc-800 rounded-t-[2.5rem] lg:rounded-3xl p-6 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] lg:shadow-2xl flex flex-col gap-4 md:gap-6 overflow-y-auto lg:sticky lg:top-20 font-sans"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-2 lg:hidden flex-shrink-0" />

                        {isTranslating ? (
                            <div className="flex flex-col items-center justify-center py-10 lg:py-20 gap-4 text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                <p className="text-sm font-medium animate-pulse">Анализ контекста...</p>
                            </div>
                        ) : translationError ? (
                            <div className="flex flex-col items-center justify-center py-8 lg:py-10 gap-4 text-center">
                                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-500">
                                    <X className="w-6 h-6 rotate-45" />
                                </div>
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{translationError}</p>
                                <button
                                    onClick={() => {
                                        setTranslationError(null);
                                        setSelectedWord(null);
                                    }}
                                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline px-4 py-2"
                                >
                                    Закрыть
                                </button>
                            </div>
                        ) : selectedWord ? (
                            <>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {selectedWord?.article && (
                                                <span className="text-pink-500 font-bold text-lg md:text-xl">{selectedWord.article}</span>
                                            )}
                                            <h3 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 truncate max-w-[200px] lg:max-w-full">
                                                {selectedWord.term}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {selectedWord?.transcription && (
                                                <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">
                                                    [{selectedWord.transcription}]
                                                </p>
                                            )}
                                            {selectedWord?.partOfSpeech && (
                                                <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase">
                                                    {selectedWord.partOfSpeech}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedWord(null)}
                                            className="lg:hidden p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-400"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 lg:mb-2">
                                        Перевод
                                    </p>
                                    <p className="text-lg md:text-xl font-bold dark:text-zinc-100 leading-tight">
                                        {selectedWord.translation}
                                    </p>
                                </div>

                                {selectedWord?.mnemonic && (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                        <p className="text-[10px] text-amber-800 dark:text-amber-200 font-black uppercase tracking-widest mb-1">💡 Мнемоника</p>
                                        <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed font-medium">
                                            {selectedWord.mnemonic}
                                        </p>
                                    </div>
                                )}

                                {selectedWord?.contextTranslation && (
                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-2">
                                        <p className="text-sm text-indigo-900 dark:text-indigo-200 font-serif italic leading-relaxed">
                                            "{selectedWord.context}"
                                        </p>
                                        <div className="w-full h-px border-t border-dashed border-indigo-200 dark:border-indigo-800" />
                                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                            {selectedWord.contextTranslation}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleAddToSRS}
                                    disabled={selectedWord.isAdded || isAdding}
                                    className={`mt-auto lg:mt-2 w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${selectedWord.isAdded
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                                        }`}
                                >
                                    {isAdding ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : selectedWord.isAdded ? (
                                        <>
                                            <Check className="w-5 h-5 stroke-[3]" /> Готово
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="w-5 h-5 stroke-[3]" /> В словарь
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
