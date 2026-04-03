"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CheckCircle2, Keyboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EnglishWord, GermanWord } from "@prisma/client";

type WordCard = (EnglishWord | GermanWord) & { topic?: string | null };

interface BlitzSessionProps {
    words: WordCard[];
    onClose: () => void;
    onReview: (wordId: string, quality: number) => Promise<void>;
}

export default function BlitzSession({ words, onClose, onReview }: BlitzSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Filter and shuffle words for blitz (only those due)
    const [sessionWords] = useState(() => 
        [...words]
            .filter(w => new Date(w.nextReview).getTime() <= Date.now())
            .sort(() => Math.random() - 0.5)
    );

    const currentWord = sessionWords[currentIndex];

    const handleAction = useCallback(async (quality: number) => {
        if (isProcessing || !currentWord) return;
        setIsProcessing(true);
        
        try {
            await onReview(currentWord.id, quality);
            if (currentIndex < sessionWords.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setShowAnswer(false);
            } else {
                toast.success("Блиц-сессия завершена! Вы герой!");
                onClose();
            }
        } catch (error) {
            console.error("Blitz Error:", error);
            toast.error("Ошибка при сохранении прогресса.");
        } finally {
            setIsProcessing(false);
        }
    }, [currentIndex, sessionWords, onReview, currentWord, isProcessing, onClose]);

    // Lock body scroll and handle keyboard
    useEffect(() => {
        document.body.style.overflow = "hidden";
        
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent scrolling with arrows/space
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.code)) {
                e.preventDefault();
            }

            if (e.code === "Space" || e.code === "Enter") {
                setShowAnswer(true);
            } else if (showAnswer && !isProcessing) {
                if (e.key === "1" || e.code === "ArrowLeft") handleAction(1);
                if (e.key === "2" || e.code === "ArrowDown") handleAction(3);
                if (e.key === "3" || e.code === "ArrowUp") handleAction(4);
                if (e.key === "4" || e.code === "ArrowRight") handleAction(5);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showAnswer, handleAction, isProcessing]);

    if (sessionWords.length === 0) {
        return (
            <div className="fixed inset-0 z-[200] bg-zinc-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Всё чисто!</h2>
                    <p className="text-zinc-400 font-medium">Нет слов для блиц-повторения. Вы всё выучили!</p>
                    <button onClick={onClose} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all">Вернуться</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col h-screen overflow-hidden select-none">
            {/* Header */}
            <div className="p-4 md:p-6 flex justify-between items-center bg-zinc-900/50 border-b border-zinc-800 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                         <h3 className="text-white font-black uppercase tracking-widest text-[10px] leading-none opacity-50 mb-1">Blitz Session</h3>
                         <div className="flex items-center gap-2">
                            <span className="text-white font-black text-sm">Прогресс:</span>
                            <span className="text-indigo-400 font-black text-sm">{currentIndex + 1} / {sessionWords.length}</span>
                         </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                
                {/* Visual Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / sessionWords.length) * 100}%` }}
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWord.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-full max-w-2xl px-6 py-12 flex flex-col items-center justify-center text-center relative"
                    >
                         {currentWord.topic && (
                            <div className="mb-8 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 backdrop-blur-sm">
                                {currentWord.topic}
                            </div>
                         )}

                         <h1 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl">
                            {currentWord.term}
                         </h1>

                         <div className="h-40 flex items-center justify-center w-full">
                            <AnimatePresence mode="wait">
                                {showAnswer ? (
                                    <motion.div 
                                        key="answer"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-3xl md:text-4xl font-black text-emerald-400 leading-tight">
                                            {currentWord.translation}
                                        </p>
                                        {"transcription" in currentWord && currentWord.transcription && (
                                            <p className="text-zinc-500 font-mono text-lg tracking-widest opacity-60">/[ {currentWord.transcription} ]/</p>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.button 
                                        key="prompt"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowAnswer(true)}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all border border-indigo-400/20"
                                    >
                                        УЗНАТЬ (Space)
                                    </motion.button>
                                )}
                            </AnimatePresence>
                         </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="p-6 md:p-10 bg-zinc-900/80 border-t border-zinc-800 backdrop-blur-xl">
                {!showAnswer ? (
                    <div className="flex flex-col items-center gap-2">
                         <div className="flex items-center gap-3 text-zinc-500">
                            <Keyboard className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest opacity-60">Нажмите ПРОБЕЛ, чтобы увидеть перевод</span>
                         </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
                        {[
                            { q: 1, label: "REDO", time: "1 мин", color: "rose", key: "1", sub: "Arrow Left" },
                            { q: 3, label: "HARD", time: "10 мин", color: "amber", key: "2", sub: "Arrow Down" },
                            { q: 4, label: "GOOD", time: "1 день", color: "indigo", key: "3", sub: "Arrow Up" },
                            { q: 5, label: "EASY", time: "4 дня", color: "emerald", key: "4", sub: "Arrow Right" }
                        ].map(btn => (
                            <button 
                                key={btn.q}
                                disabled={isProcessing}
                                onClick={() => handleAction(btn.q)}
                                className={`group p-4 md:p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center transition-all hover:bg-${btn.color}-600/10 hover:border-${btn.color}-500/40 relative overflow-hidden active:scale-95 disabled:opacity-50`}
                            >
                                {isProcessing && quality === btn.q && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    </div>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-zinc-500 group-hover:text-${btn.color}-400 transition-colors`}>{btn.label} ({btn.key})</span>
                                <span className={`text-xl md:text-2xl font-black text-white group-hover:text-${btn.color}-400 mb-2`}>{btn.time}</span>
                                <span className="text-[10px] font-bold text-zinc-600 italic font-mono uppercase opacity-40 group-hover:opacity-100">{btn.sub}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Tailwind Helper for dynamic colors */}
            <div className="hidden border-rose-500/40 border-amber-500/40 border-indigo-500/40 border-emerald-500/40 bg-rose-600/10 bg-amber-600/10 bg-indigo-600/10 bg-emerald-600/10 text-rose-400 text-amber-400 text-indigo-400 text-emerald-400" />
        </div>
    );
}
