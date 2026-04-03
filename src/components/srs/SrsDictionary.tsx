"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, Trash2, BookOpen, Clock, AlertCircle, PlayCircle, Plus, X, Sparkles, Download, Upload, FileJson, Hash } from "lucide-react";
import { EnglishWord, GermanWord } from "@prisma/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { calculateNextSequence, formatIntervalUI } from "@/lib/srs";
import BlitzSession from "./BlitzSession";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SrsDictionaryProps {
    module: "english" | "german";
}

// Extend Prisma types to ensure topic is recognized even if client is refreshing
type WordCard = (EnglishWord | GermanWord) & { topic?: string | null };

export default function SrsDictionary({ module }: SrsDictionaryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedWord, setSelectedWord] = useState<WordCard | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newWordForm, setNewWordForm] = useState({
        word: "",
        translation: "",
        contextSentence: "",
        transcription: "",
        mnemonic: "",
        topic: ""
    });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState<any>(null);
    const [importStats, setImportStats] = useState<{ total: number, imported: number, skipped: number } | null>(null);
    const [isBlitzOpen, setIsBlitzOpen] = useState(false);

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

    // Filter by topic
    const filteredWords = Object.values(words).filter(w => {
        if (!selectedTopic) return true;
        return w.topic === selectedTopic;
    });

    // Unique topics list
    const allTopics = useMemo(() => {
        return Array.from(new Set(words.map(w => w.topic).filter(Boolean))) as string[];
    }, [words]);

    const handleDelete = async (id: string) => {
        if (!confirm("Вы уверены, что хотите удалить это слово навсегда?")) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/srs/dictionary?module=${module}&id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                mutate();
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
                mutate();
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
                    mnemonic: data.mnemonic || prev.mnemonic,
                    topic: data.topic || prev.topic
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
                        mnemonic: newWordForm.mnemonic.trim() || null,
                        topic: newWordForm.topic.trim() || null
                    }
                })
            });

            if (res.ok) {
                mutate();
                toast.success("Слово добавлено!");
                setIsAddModalOpen(false);
                setNewWordForm({ word: "", translation: "", contextSentence: "", transcription: "", mnemonic: "", topic: "" });
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

    const handleExport = async () => {
        try {
            window.location.href = `/api/srs/export?module=${module}`;
            toast.success("Словарь готовится к скачиванию...");
        } catch (error) {
            toast.error("Ошибка при экспорте.");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data.words || !Array.isArray(data.words)) {
                    toast.error("Неверный формат файла.");
                    return;
                }
                setImportData(data);
                setIsImportModalOpen(true);
                setImportStats(null);
            } catch (error) {
                toast.error("Ошибка при чтении файла JSON.");
            }
        };
        reader.readAsText(file);
    };

    const confirmImport = async () => {
        if (!importData) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/srs/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(importData)
            });

            if (res.ok) {
                const result = await res.json();
                setImportStats(result.stats);
                mutate();
                toast.success(`Импорт завершен! Добавлено: ${result.stats.imported}`);
            } else {
                toast.error("Ошибка при импорте.");
            }
        } catch (error) {
            toast.error("Ошибка сети.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                
                {/* Visual Stats Banner */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-4 flex justify-between items-center px-6">
                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Всего</span>
                            <span className="text-xl font-black text-zinc-900 dark:text-white">{words.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">К повтору</span>
                            <span className="text-xl font-black text-emerald-500 text-center">
                                {words.filter(w => new Date(w.nextReview).getTime() <= Date.now()).length}
                            </span>
                        </div>
                    </div>
                    <button 
                         onClick={() => setIsBlitzOpen(true)}
                         className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <PlayCircle className="w-4 h-4" /> Блиц-повтор
                    </button>
                </div>

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

                    {/* Import Button */}
                    <div className="relative overflow-hidden flex items-center justify-center">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl transition-colors shadow-sm flex items-center justify-center shrink-0"
                            title="Импортировать словарь"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline ml-2 font-medium">Импорт</span>
                        </button>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-2xl transition-colors shadow-sm flex items-center justify-center shrink-0"
                        title="Экспортировать словарь"
                    >
                        <Upload className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2 font-medium">Экспорт</span>
                    </button>
                </div>

                {/* Topic Tags Filter */}
                {allTopics.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        <button
                            onClick={() => setSelectedTopic(null)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!selectedTopic 
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white" 
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-transparent hover:bg-zinc-200"}`}
                        >
                            Все темы
                        </button>
                        {allTopics.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setSelectedTopic(topic)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedTopic === topic
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between px-2 text-sm text-zinc-500 font-medium font-sans">
                    <span>Всего слов: {words.length}</span>
                    {selectedTopic && <span>В теме: {filteredWords.length}</span>}
                </div>

                {/* Words List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-y-auto pr-1 pb-20 md:pb-0 relative" style={{ maxHeight: "calc(100vh - 320px)" }}>
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
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">{word.term}</h3>
                                        {word.topic && (
                                            <span className="text-[10px] uppercase font-black text-indigo-500 tracking-tighter mt-0.5 truncate">
                                                {word.topic}
                                            </span>
                                        )}
                                    </div>
                                    {new Date(word.nextReview).getTime() > Date.now() ? (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-rose-50 dark:bg-rose-950/30 text-rose-500 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Таймер активен">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            {formatIntervalUI((new Date(word.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Ожидает повторения в тренажере">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Пора
                                        </div>
                                    )}
                                </div>
                                <p className="text-zinc-500 text-sm mt-1 line-clamp-1 italic">{word.translation || "Нет перевода"}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Col: Word Details */}
            <AnimatePresence>
                {selectedWord && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed inset-0 z-50 md:static md:w-[400px] md:z-auto md:shrink-0 flex flex-col"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSelectedWord(null)} />
                        <div className="absolute bottom-0 left-0 right-0 top-16 md:top-auto md:relative md:h-auto bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl md:shadow-lg flex flex-col overflow-hidden">
                            <div className="w-full flex justify-center py-3 md:hidden" onClick={() => setSelectedWord(null)}>
                                <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                             {selectedWord.topic && (
                                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-md tracking-widest">
                                                    {selectedWord.topic}
                                                </span>
                                             )}
                                        </div>
                                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white break-words">
                                            {selectedWord.term}
                                        </h2>
                                        {"transcription" in selectedWord && selectedWord.transcription && (
                                            <p className="text-zinc-500 font-mono mt-1 text-sm">/[ {selectedWord.transcription} ]/</p>
                                        )}
                                         {"article" in selectedWord && selectedWord.article && (
                                            <p className="text-indigo-500 font-bold mt-1 text-sm">{selectedWord.article}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(selectedWord.id)}
                                        disabled={isSubmitting}
                                        className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                    <p className="font-bold text-indigo-900 dark:text-indigo-200 text-lg leading-snug">
                                        {selectedWord.translation || "Перевод не указан"}
                                    </p>
                                </div>

                                {(selectedWord.context || selectedWord.contextTranslation) && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5" /> Контекст
                                        </h4>
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                                            {selectedWord.context && <p className="text-zinc-900 dark:text-zinc-100 italic">"{selectedWord.context}"</p>}
                                            {selectedWord.contextTranslation && <p className="text-zinc-500 text-sm">{selectedWord.contextTranslation}</p>}
                                        </div>
                                    </div>
                                )}

                                {selectedWord.mnemonic && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                            💡 Ассоциация
                                        </h4>
                                        <p className="text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 text-sm italic">
                                            {selectedWord.mnemonic}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3 mt-auto">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Планировщик
                                    </h4>
                                    <p className="text-xs text-zinc-500 mb-2">
                                        След. повторение: <span className="font-bold text-indigo-500">{new Date(selectedWord.nextReview).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[{ q: 1, label: "Снова", t: "1м", c: "rose" }, { q: 3, label: "Сложно", t: "10м", c: "amber" }, { q: 4, label: "Норм", t: "1д", c: "emerald" }, { q: 5, label: "Легко", t: "4д", c: "cyan" }].map(item => (
                                            <button
                                                key={item.q}
                                                disabled={isSubmitting}
                                                onClick={() => handleReschedule(item.q)}
                                                className={`px-1 py-3 bg-${item.c}-100 dark:bg-${item.c}-950/30 text-${item.c}-700 dark:text-${item.c}-400 rounded-xl flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all`}
                                            >
                                                <span className="text-[10px] font-black leading-none mb-1 uppercase tracking-tight">{item.label}</span>
                                                <span className="text-[9px] opacity-70 leading-none">{item.t}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleReschedule(0)}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl text-sm font-black flex flex-col items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 mt-2"
                                    >
                                        <div className="flex items-center gap-1.5 leading-none mb-1 uppercase tracking-widest">
                                            <PlayCircle className="w-4 h-4" /> В ТРЕНАЖЁР
                                        </div>
                                        <span className="text-[9px] font-medium opacity-80 leading-none text-center px-4 uppercase tracking-tighter">Снимает задолженность сейчас</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 md:hidden border-t border-zinc-200 dark:border-zinc-800">
                                <button onClick={() => setSelectedWord(null)} className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-400">Закрыть</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual Add Word Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 underline decoration-indigo-500 decoration-4 underline-offset-4">
                                    Новое слово
                                </h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Слово / Фраза</label>
                                    <div className="flex gap-2">
                                        <input type="text" required value={newWordForm.word} onChange={e => setNewWordForm({ ...newWordForm, word: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-lg font-bold" placeholder="Apple" />
                                        <button type="button" onClick={handleAutoFill} disabled={isGenerating || !newWordForm.word.trim() || isSubmitting} className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shrink-0 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-indigo-500/20" title="Заполнить через ИИ">
                                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Перевод</label>
                                    <input type="text" required value={newWordForm.translation} onChange={e => setNewWordForm({ ...newWordForm, translation: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Яблоко" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Тема</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                            <input type="text" value={newWordForm.topic} onChange={e => setNewWordForm({ ...newWordForm, topic: e.target.value })} className="w-full pl-8 pr-3 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold" placeholder="Еда" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{module === 'german' ? 'Артикль' : 'Транскр.'}</label>
                                        <input type="text" value={newWordForm.transcription} onChange={e => setNewWordForm({ ...newWordForm, transcription: e.target.value })} className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold" placeholder={module === 'german' ? 'der' : '/ˈæp.əl/'} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Контекст</label>
                                    <textarea value={newWordForm.contextSentence} onChange={e => setNewWordForm({ ...newWordForm, contextSentence: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="I like eating red apples..." rows={2} />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Ассоциация (ИИ)</label>
                                    <textarea value={newWordForm.mnemonic} onChange={e => setNewWordForm({ ...newWordForm, mnemonic: e.target.value })} className="w-full p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm italic" placeholder="Ассоциация для запоминания..." rows={2} />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-black uppercase tracking-widest text-xs transition-colors">Отмена</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "СОХРАНИТЬ"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import Confirmation Modal */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsImportModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Импорт словаря</h3>
                                <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4 text-center">
                                {!importStats ? (
                                    <>
                                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileJson className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h4 className="font-bold text-lg">Обнаружен список: {importData?.metadata?.module === 'english' ? '🇬🇧 Английский' : '🇩🇪 Немецкий'}</h4>
                                        <p className="text-zinc-500 text-sm">Количество слов: <span className="font-bold text-indigo-500">{importData?.words?.length || 0}</span></p>
                                        <div className="flex gap-3 pt-4">
                                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium">Отмена</button>
                                            <button onClick={confirmImport} disabled={isSubmitting} className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Начать импорт"}</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-indigo-500" /></div>
                                        <h4 className="font-bold text-lg">Импорт завершен!</h4>
                                        <div className="grid grid-cols-3 gap-2 py-4">
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"><p className="text-xs text-zinc-400">Всего</p><p className="text-lg font-bold">{importStats.total}</p></div>
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl"><p className="text-xs text-emerald-500/70">Новых</p><p className="text-lg font-bold text-emerald-500">{importStats.imported}</p></div>
                                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl"><p className="text-xs text-rose-500/70">Дубликатов</p><p className="text-lg font-bold text-rose-500">{importStats.skipped}</p></div>
                                        </div>
                                        <button onClick={() => setIsImportModalOpen(false)} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium mt-4">Отлично</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBlitzOpen && (
                    <BlitzSession 
                        words={words} 
                        onClose={() => setIsBlitzOpen(false)} 
                        onReview={async (id, q) => {
                            // Temporary review logic if selectedWord is not needed
                            const res = await fetch("/api/srs/review", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    wordId: id,
                                    quality: q,
                                    module,
                                }),
                            });
                            if (res.ok) mutate();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
