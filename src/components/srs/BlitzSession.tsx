"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ChevronRight, CheckCircle2, AlertCircle, Keyboard } from "lucide-react";
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
    
    // Shuffle words for blitz (only those due)
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
            toast.error("Ошибка при сохранении прогресса.");
        } finally {
            setIsProcessing(false);
        }
    }, [currentIndex, sessionWords, onReview, currentWord, isProcessing, onClose]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                setShowAnswer(true);
            } else if (showAnswer) {
                if (e.key === "1" || e.key === "ArrowLeft") handleAction(1); // Again
                if (e.key === "2" || e.key === "ArrowDown") handleAction(3); // Hard
                if (e.key === "3" || e.key === "ArrowUp") handleAction(4);   // Good
                if (e.key === "4" || e.key === "ArrowRight") handleAction(5); // Easy
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showAnswer, handleAction]);

    if (sessionWords.length === 0) {
        return (
            <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="max-w-sm space-y-6">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Всё чисто!</h2>
                    <p className="text-zinc-400 font-medium">На данный момент нет слов для блиц-повторения. Вы отлично поработали!</p>
                    <button onClick={onClose} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Вернуться</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col font-sans">
            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-zinc-900/50 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">Блиц-режим</h3>
                        <p className="text-zinc-500 text-[10px] font-bold mt-1">Осталось: {sessionWords.length - currentIndex}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Session Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentIndex / sessionWords.length) * 100}%` }}
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWord.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="w-full max-w-lg aspect-[4/3] flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] relative"
                    >
                         {currentWord.topic && (
                            <span className="absolute top-8 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                                {currentWord.topic}
                            </span>
                         )}

                         <h1 className="text-5xl md:text-6xl font-black text-white mb-4 transition-all">
                            {currentWord.term}
                         </h1>

                         <AnimatePresence>
                             {showAnswer ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {currentWord.translation}
                                    </p>
                                    {"transcription" in currentWord && currentWord.transcription && (
                                        <p className="text-zinc-500 font-mono text-sm tracking-widest">{currentWord.transcription}</p>
                                    )}
                                    {currentWord.context && (
                                        <p className="text-zinc-400 text-sm italic max-w-xs mx-auto opacity-60">"{currentWord.context}"</p>
                                    )}
                                </motion.div>
                             ) : (
                                <button 
                                    onClick={() => setShowAnswer(true)}
                                    className="px-8 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-sm font-bold animate-pulse hover:bg-indigo-600 hover:text-white transition-all"
                                >
                                    Показать перевод (Пробел)
                                </button>
                             )}
                         </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="p-8 bg-zinc-900 border-t border-zinc-800">
                {!showAnswer ? (
                    <div className="flex flex-col items-center gap-4">
                         <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                            <Keyboard className="w-4 h-4" />
                            <span>Нажмите ПРОБЕЛ, чтобы перевернуть карточку</span>
                         </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        <button 
                            onClick={() => handleAction(1)}
                            className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex flex-col items-center hover:bg-rose-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-black uppercase mb-1">Снова (1)</span>
                            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic font-mono">← Arrow Left</span>
                        </button>
                        <button 
                            onClick={() => handleAction(3)}
                            className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex flex-col items-center hover:bg-amber-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-black uppercase mb-1">Сложно (2)</span>
                            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic font-mono">↓ Arrow Down</span>
                        </button>
                        <button 
                            onClick={() => handleAction(4)}
                            className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl flex flex-col items-center hover:bg-indigo-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-black uppercase mb-1">Хорошо (3)</span>
                            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic font-mono">↑ Arrow Up</span>
                        </button>
                        <button 
                            onClick={() => handleAction(5)}
                            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex flex-col items-center hover:bg-emerald-500 hover:text-white transition-all group"
                        >
                            <span className="text-xs font-black uppercase mb-1">Легко (4)</span>
                            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic font-mono">→ Arrow Right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
