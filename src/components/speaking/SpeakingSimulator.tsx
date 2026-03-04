"use client";

import { useState, useEffect, useRef } from "react";
import { SpeakingTopic, RedemittelCategory } from "@/lib/speaking-data";
import { Mic, Square, RotateCcw, Send, CheckCircle2, AlertCircle, Globe, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Props {
    topics: SpeakingTopic[];
    categories: RedemittelCategory[];
    module: "english" | "german";
}

export default function SpeakingSimulator({ topics, categories, module }: Props) {
    const [currentTopic, setCurrentTopic] = useState<SpeakingTopic>(topics[0]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Target phrases for the current module
    const allPhrases = categories.flatMap(c => c.phrases.map(p => p.phrase));

    // Web Speech API
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = module === "english" ? "en-US" : "de-DE";

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = "";
                let finalTranscriptChunk = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptChunk += event.results[i][0].transcript + " ";
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscriptChunk) {
                    setTranscript(prev => prev + (prev.endsWith(" ") ? "" : " ") + finalTranscriptChunk.trim());
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    toast.error("Доступ к микрофону запрещен. Разрешите его в настройках браузера (значок замка в адресной строке).");
                } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    toast.error("Ошибка распознавания речи: " + event.error);
                }
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [module]);

    const startRecording = async () => {
        setTranscript("");
        setAnalysisResult(null);

        try {
            // Explicitly request microphone access to trigger the browser prompt
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Immediately stop tracks as SpeechRecognition handles its own stream
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Microphone access denied", err);
            toast.error("Доступ к микрофону запрещен. Разрешите его в браузере (значок замка в адресной строке).");
            setIsRecording(false);
            return;
        }

        setIsRecording(true);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start recognition", e);
                toast.error("Ошибка запуска распознавания речи. Попробуйте перезагрузить страницу.");
                setIsRecording(false);
            }
        } else {
            toast.error("Ваш браузер не поддерживает голосовое распознавание (используйте Chrome/Safari).");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        setIsRecording(false); // Force state update immediately
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort(); // Force abort instead of soft stop
            } catch (e) {
                console.error("Error aborting recognition", e);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!transcript.trim()) return;

        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/speaking/analyze", {
                method: "POST",
                body: JSON.stringify({
                    transcript,
                    topic: currentTopic.question,
                    module,
                    targetPhrases: allPhrases
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAnalysisResult(data);
            toast.success("Анализ завершен!");
        } catch (e: any) {
            toast.error(e.message || "Ошибка при анализе");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Interactive Section */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded">
                            {currentTopic.context}
                        </span>
                        <div className="flex gap-2">
                            {topics.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setCurrentTopic(t);
                                        setTranscript("");
                                        setAnalysisResult(null);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${currentTopic.id === t.id ? 'bg-indigo-500 w-4' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                        {currentTopic.title}
                    </h3>
                    <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed italic border-l-4 border-indigo-500/30 pl-4">
                        "{currentTopic.question}"
                    </p>
                </div>

                {/* Recorder Area */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
                    <AnimatePresence>
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
                            >
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 overflow-hidden">
                                    <motion.div
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="w-1/2 h-full bg-white/50"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!transcript && !isRecording ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                <Mic className="w-8 h-8 text-zinc-400" />
                            </div>
                            <p className="text-zinc-500 max-w-xs">
                                Нажмите на кнопку записи и начните говорить. Постарайтесь использовать заготовки справа.
                            </p>
                            <button
                                onClick={startRecording}
                                className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 mx-auto"
                            >
                                <Mic className="w-5 h-5" />
                                Начать запись
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col gap-4">
                            <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[200px]">
                                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                    {transcript || (isRecording ? "Слушаю..." : "")}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <button
                                    onClick={() => {
                                        if (recognitionRef.current) recognitionRef.current.abort();
                                        setIsRecording(false);
                                        setTranscript("");
                                        setAnalysisResult(null);
                                    }}
                                    className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 transition-all shrink-0"
                                    title="Сбросить"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>

                                {isRecording ? (
                                    <button
                                        onClick={stopRecording}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        Остановить
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !transcript.trim()}
                                        className="flex-1 py-3 bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        {isAnalyzing ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                        {isAnalyzing ? "Анализирую..." : "Проверить ИИ"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Results / Templates Info */}
            <div className="space-y-6">
                <AnimatePresence mode="wait">
                    {analysisResult ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-500" />
                                    Результат анализа
                                </h3>
                                <div className="text-3xl font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl">
                                    {analysisResult.score}
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Обратная связь</h4>
                                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {analysisResult.feedback}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Использование шаблонов</h4>
                                {analysisResult.phraseAnalysis.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-3">
                                        {item.used ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                                        )}
                                        <div className="space-y-0.5">
                                            <p className={`font-semibold ${item.used ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                                                {item.phrase}
                                            </p>
                                            <p className="text-xs text-zinc-500">{item.comment}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6"
                        >
                            <h4 className="font-bold text-indigo-500 mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5" />
                                Как это работает?
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    { t: "Выберите тему", d: "Нажмите на точки сверху, чтобы сменить вопрос." },
                                    { t: "Изучите фразы", d: "Внизу страницы список шаблонов. Попробуйте встроить их в речь." },
                                    { t: "Запишите ответ", d: "Мы используем браузерный STT для перевода речи в текст." },
                                    { t: "Получите оценку", d: "ИИ проанализирует вашу речь на предмет использования шаблонов и выставит балл." }
                                ].map((step, idx) => (
                                    <li key={idx} className="flex gap-4">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-zinc-50">{step.t}</p>
                                            <p className="text-sm text-zinc-500">{step.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
