"use client";

import { useState, useEffect } from "react";

import { Search, Loader2, Trash2, BookOpen, Clock, AlertCircle, PlayCircle, Plus, X, Sparkles } from "lucide-react";
import { EnglishWord, GermanWord } from "@prisma/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { calculateNextSequence, formatIntervalUI } from "@/lib/srs";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SrsDictionaryProps {
    module: "english" | "german";
}

type WordCard = EnglishWord | GermanWord;

export default function SrsDictionary({ module }: SrsDictionaryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedWord, setSelectedWord] = useState<WordCard | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newWordForm, setNewWordForm] = useState({
        word: "",
        translation: "",
        contextSentence: "",
        transcription: "", // or article for german, can repurpose
        mnemonic: ""
    });

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fast loading with SWR
    const { data: words = [], isLoading, mutate } = useSWR<WordCard[]>(
        `/api/srs/dictionary?module=${module}&q=${encodeURIComponent(debouncedQuery)}`,
        fetcher,
        {
            keepPreviousData: true,
            revalidateOnFocus: false
        }
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Вы уверены, что хотите удалить это слово навсегда?")) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/srs/dictionary?module=${module}&id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                mutate(); // instantly refresh the cache
                setSelectedWord(null);
                toast.success("Слово удалено!");
            } else {
                toast.error("Не удалось удалить слово.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ошибка при удалении.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReschedule = async (quality: number) => {
        if (!selectedWord || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/srs/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wordId: selectedWord.id,
                    quality,
                    module,
                }),
            });

            if (res.ok) {
                mutate(); // instantly refresh the cache
                toast.success(quality === 0 ? "Слово добавлено в тренажёр!" : "Слово успешно перенесено!");
                setSelectedWord(null);
            } else {
                toast.error("Не удалось перенести карточку.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ошибка сети.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoFill = async () => {
        if (!newWordForm.word.trim()) {
            toast.error("Сначала введите слово для перевода.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/srs/generate-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    word: newWordForm.word.trim(),
                    module
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNewWordForm(prev => ({
                    ...prev,
                    translation: data.translation || prev.translation,
                    contextSentence: data.context || prev.contextSentence,
                    transcription: data.transcription || prev.transcription,
                    mnemonic: data.mnemonic || prev.mnemonic
                }));
                toast.success("Карточка заполнена ИИ!");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Ошибка генерации ИИ.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ошибка сети при обращении к ИИ.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWordForm.word.trim() || !newWordForm.translation.trim()) {
            toast.error("Поля 'Слово' и 'Перевод' обязательны.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/srs/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    module,
                    wordData: {
                        term: newWordForm.word.trim(),
                        translation: newWordForm.translation.trim(),
                        context: newWordForm.contextSentence.trim() || null,
                        transcription: module === 'english' ? (newWordForm.transcription.trim() || null) : null,
                        article: module === 'german' ? (newWordForm.transcription.trim() || null) : null,
                        mnemonic: newWordForm.mnemonic.trim() || null
                    }
                })
            });

            if (res.ok) {
                mutate(); // Refresh the list
                toast.success("Слово добавлено!");
                setIsAddModalOpen(false);
                setNewWordForm({ word: "", translation: "", contextSentence: "", transcription: "", mnemonic: "" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Не удалось добавить слово.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ошибка сети.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredWords = words; // Already filtered by DB

    if (isLoading && !words.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p>Загрузка словаря...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 relative">

            {/* Left Col: Search & List */}
            <div className={`flex-1 flex flex-col gap-4 ${selectedWord ? 'hidden md:flex' : 'flex'}`}>
                {/* Header Actions */}
                <div className="flex gap-2 w-full">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Поиск по слову или переводу..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium shadow-sm"
                        />
                    </div>
                    {/* Add Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl transition-colors shadow-sm flex items-center justify-center shrink-0"
                        title="Добавить слово вручную"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2 font-medium">Добавить</span>
                    </button>
                </div>

                <div className="flex items-center justify-between px-2 text-sm text-zinc-500 font-medium font-sans">
                    <span>Всего слов: {words.length}</span>
                    {searchQuery && <span>Найдено: {filteredWords.length}</span>}
                </div>

                {/* Words List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative" style={{ maxHeight: "calc(100vh - 250px)" }}>
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    )}
                    {filteredWords.length === 0 && !isLoading ? (
                        <div className="col-span-full py-12 text-center text-zinc-500 flex flex-col items-center">
                            <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                            <p>Ничего не найдено.</p>
                        </div>
                    ) : (
                        filteredWords.map(word => (
                            <button
                                key={word.id}
                                onClick={() => setSelectedWord(word)}
                                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${selectedWord?.id === word.id
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm"
                                    : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"}`}
                            >
                                <div className="flex justify-between items-start w-full gap-2">
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">{word.term}</h3>
                                    {((word.srsStep > 0 || (word.nextReview && new Date(word.nextReview) <= new Date())) && new Date(word.nextReview) > new Date()) && (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-rose-50 dark:bg-rose-950/30 text-rose-500 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Таймер активен">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            {formatIntervalUI((new Date(word.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                    )}
                                    {(word.srsStep === 0 || new Date(word.nextReview) <= new Date()) && (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Ожидает повторения в тренажере">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Пора повторить
                                        </div>
                                    )}
                                </div>
                                <p className="text-zinc-500 text-sm mt-1 line-clamp-1">{word.translation || "Нет перевода"}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Col: Word Details (Mobile Overlay / Desktop Sticky Sidebar) */}
            <AnimatePresence>
                {selectedWord && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed inset-0 z-50 md:static md:w-[400px] md:z-auto md:shrink-0 flex flex-col"
                    >
                        {/* Mobile backdrop */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSelectedWord(null)} />

                        {/* Card Container */}
                        <div className="absolute bottom-0 left-0 right-0 top-16 md:top-auto md:relative md:h-auto bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl md:shadow-lg flex flex-col overflow-hidden">
                            {/* Header Handle for Mobile */}
                            <div className="w-full flex justify-center py-3 md:hidden" onClick={() => setSelectedWord(null)}>
                                <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                {/* Title and Delete */}
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white break-words">
                                            {selectedWord.term}
                                        </h2>
                                        {"transcription" in selectedWord && selectedWord.transcription && (
                                            <p className="text-zinc-500 font-mono mt-1 text-sm">/[ {selectedWord.transcription} ]/</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(selectedWord.id)}
                                        disabled={isSubmitting}
                                        className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
                                        title="Удалить карточку"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Translation */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl">
                                    <p className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                                        {selectedWord.translation || "Перевод не указан"}
                                    </p>
                                </div>

                                {/* Context */}
                                {(selectedWord.context || selectedWord.contextTranslation) && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5" /> Контекст
                                        </h4>
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl space-y-2">
                                            {selectedWord.context && (
                                                <p className="text-zinc-900 dark:text-zinc-100 italic">"{selectedWord.context}"</p>
                                            )}
                                            {selectedWord.contextTranslation && (
                                                <p className="text-zinc-500 text-sm">{selectedWord.contextTranslation}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Mnemonic */}
                                {selectedWord.mnemonic && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            💡 Ассоциация (Мнемоника)
                                        </h4>
                                        <p className="text-zinc-700 dark:text-zinc-300 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl">
                                            {selectedWord.mnemonic}
                                        </p>
                                    </div>
                                )}

                                {/* Scheduling Info */}
                                <div className="space-y-3 mt-auto">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Перенести / Оценить
                                    </h4>
                                    <p className="text-sm text-zinc-500 mb-2">
                                        Следующее повторение: <span className="font-bold text-indigo-500">{new Date(selectedWord.nextReview).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    </p>

                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleReschedule(1)}
                                            className="px-1 py-3 bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl flex flex-col items-center justify-center hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold leading-none mb-1">Опять</span>
                                            <span className="text-[10px] opacity-70 leading-none">{formatIntervalUI(calculateNextSequence(1, selectedWord.srsStep, selectedWord.easiness, selectedWord.interval).newInterval)}</span>
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleReschedule(3)}
                                            className="px-1 py-3 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl flex flex-col items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold leading-none mb-1">Трудно</span>
                                            <span className="text-[10px] opacity-70 leading-none">{formatIntervalUI(calculateNextSequence(3, selectedWord.srsStep, selectedWord.easiness, selectedWord.interval).newInterval)}</span>
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleReschedule(4)}
                                            className="px-1 py-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex flex-col items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold leading-none mb-1">Хорошо</span>
                                            <span className="text-[10px] opacity-70 leading-none">{formatIntervalUI(calculateNextSequence(4, selectedWord.srsStep, selectedWord.easiness, selectedWord.interval).newInterval)}</span>
                                        </button>
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => handleReschedule(5)}
                                            className="px-1 py-3 bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 rounded-xl flex flex-col items-center justify-center hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                                        >
                                            <span className="text-xs font-bold leading-none mb-1">Легко</span>
                                            <span className="text-[10px] opacity-70 leading-none">{formatIntervalUI(calculateNextSequence(5, selectedWord.srsStep, selectedWord.easiness, selectedWord.interval).newInterval)}</span>
                                        </button>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleReschedule(0)}
                                            disabled={isSubmitting}
                                            className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold flex flex-col items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800/50"
                                        >
                                            <div className="flex items-center gap-1.5 leading-none mb-1">
                                                <PlayCircle className="w-4 h-4" />
                                                Начать активное повторение
                                            </div>
                                            <span className="text-[10px] font-medium opacity-80 leading-none">
                                                Снимает задолженность и переносит для немедленного повторения в тренажер
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Close Button (Bottom) */}
                            <div className="p-4 md:hidden border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setSelectedWord(null)}
                                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-400"
                                >
                                    Закрыть вкладку
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual Add Word Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Добавить слово</h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Слово <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={newWordForm.word}
                                            onChange={e => setNewWordForm({ ...newWordForm, word: e.target.value })}
                                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Например: Apple"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutoFill}
                                            disabled={isGenerating || !newWordForm.word.trim() || isSubmitting}
                                            className="px-4 bg-amber-100 hover:bg-amber-200 text-amber-600 dark:bg-amber-900/30 dark:hover:bg-amber-800/50 dark:text-amber-400 rounded-xl transition-colors shrink-0 flex items-center justify-center font-medium disabled:opacity-50"
                                            title="Сгенерировать перевод и контекст через ИИ"
                                        >
                                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1.5 ml-1">
                                        Введите слово и нажмите ✨, чтобы ИИ заполнил остальное.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Перевод <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newWordForm.translation}
                                        onChange={e => setNewWordForm({ ...newWordForm, translation: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Например: Яблоко"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Пример (Контекст)
                                    </label>
                                    <textarea
                                        value={newWordForm.contextSentence}
                                        onChange={e => setNewWordForm({ ...newWordForm, contextSentence: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Необязательно"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Мнемоника / Ассоциация
                                    </label>
                                    <textarea
                                        value={newWordForm.mnemonic}
                                        onChange={e => setNewWordForm({ ...newWordForm, mnemonic: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500"
                                        placeholder="Ассоциация для легкого запоминания..."
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        {module === 'german' ? 'Артикль / Доп. инфо' : 'Транскрипция'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newWordForm.transcription}
                                        onChange={e => setNewWordForm({ ...newWordForm, transcription: e.target.value })}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        placeholder={module === 'german' ? 'der, die, das...' : '/ˈæp.əl/'}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
