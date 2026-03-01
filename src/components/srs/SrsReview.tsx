"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Check, X, Eye, Loader2, ArrowRight, Trash2 } from "lucide-react";
import { EnglishWord, GermanWord } from "@prisma/client";

interface SrsReviewProps {
  module: "english" | "german";
}

type CardData = EnglishWord | GermanWord;

export default function SrsReview({ module }: SrsReviewProps) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    fetchDueCards();
  }, [module]);

  const fetchDueCards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/srs/due?module=${module}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data);
        if (data.length === 0) setSessionComplete(true);
      }
    } catch (error) {
      console.error("Failed to fetch due cards", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (cards.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const currentCard = cards[currentIndex];

    try {
      const res = await fetch("/api/srs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: currentCard.id,
          quality,
          module,
        }),
      });

      if (res.ok) {
        // Move to next card
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setIsFlipped(false);
        } else {
          setSessionComplete(true);
        }
      } else {
        console.error("Failed to submit review");
      }
    } catch (error) {
      console.error("API error during review", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p>Загрузка ваших ежедневных повторений...</p>
      </div>
    );
  }

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Все карточки повторены!</h2>
        <p className="text-zinc-500 max-w-md text-center">
          На данный момент слов для повторения нет. Читайте тексты или используйте Шэдоуинг, чтобы добавить новые слова.
        </p>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="w-full mb-8">
        <div className="flex justify-between text-sm text-zinc-500 font-medium mb-2 uppercase tracking-wider">
          <span>Повторение: {module === 'german' ? 'Немецкий' : 'Английский'}</span>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(currentIndex / cards.length) * 100}% ` }}
          />
        </div>
      </div>

      {/* Flashcard Area */}
      <div
        className="relative w-full aspect-[4/3] perspective-1000"
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl p-8 cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={() => setIsFlipped(true)}
            >
              <div className="flex flex-col items-center text-center gap-4">
                {module === "german" && (card as GermanWord).article && (
                  <span className="text-2xl font-bold text-pink-500 uppercase tracking-widest">
                    {(card as GermanWord).article}
                  </span>
                )}
                <h2 className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-zinc-100">
                  {card.term}
                </h2>

                <div className="mt-8 flex items-center gap-2 text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full">
                  <Eye className="w-4 h-4" /> Нажмите, чтобы увидеть перевод
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl shadow-xl p-8"
            >
              <div className="flex flex-col items-center text-center gap-6 w-full max-w-md">
                <p className="text-sm font-bold tracking-widest text-indigo-500 uppercase">Перевод</p>
                <h3 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                  {card.translation}
                </h3>

                {card.contextTranslation && (
                  <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-left w-full border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-serif italic text-zinc-600 dark:text-zinc-300 mb-2">
                      “{card.context}”
                    </p>
                    <p className="text-sm font-medium text-zinc-500">
                      {card.contextTranslation}
                    </p>
                  </div>
                )}

                {card.mnemonic && (
                  <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-xl">
                    💡 {card.mnemonic}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Answer Controls */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-8"
          >
            <p className="text-center text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Насколько хорошо вы это знали?</p>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleReview(1)}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 transition-colors"
                title="Забыл полностью (1)"
              >
                <span className="font-bold text-lg">Снова</span>
                <span className="text-[10px] opacity-70">1 мин</span>
              </button>
              <button
                onClick={() => handleReview(3)}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 dark:text-amber-400 transition-colors"
                title="Трудно вспомнить (3)"
              >
                <span className="font-bold text-lg">Сложно</span>
                <span className="text-[10px] opacity-70">10 мин</span>
              </button>
              <button
                onClick={() => handleReview(4)}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 transition-colors"
                title="Вспомнил с запинкой (4)"
              >
                <span className="font-bold text-lg">Хорошо</span>
                <span className="text-[10px] opacity-70">1 день</span>
              </button>
              <button
                onClick={() => handleReview(5)}
                disabled={isSubmitting}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 transition-colors"
                title="Идеально (5)"
              >
                <span className="font-bold text-lg">Легко</span>
                <span className="text-[10px] opacity-70">4 дня</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
