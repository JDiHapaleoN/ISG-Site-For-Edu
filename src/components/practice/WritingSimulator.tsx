"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Send, RefreshCcw, Loader2, CheckCircle, FileText, BarChart3, PieChart, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Data ---

interface ChartData {
    type: "bar" | "line" | "pie";
    title: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        color: string;
    }[];
}

interface Prompt {
    id: string;
    type: string;
    language: "english" | "german";
    timeLimit: number;
    text: string;
    chart?: ChartData;
}

const IELTS_T1_PROMPTS: Prompt[] = [
    {
        id: "ielts-t1-1",
        type: "Task 1",
        language: "english",
        timeLimit: 20 * 60,
        text: "The bar chart below shows the number of visitors to three different types of museums in London between 2010 and 2015. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: {
            type: "bar",
            title: "London Museum Visitors (2010-2015)",
            labels: ["2010", "2011", "2012", "2013", "2014", "2015"],
            datasets: [
                { label: "British Museum", data: [5.8, 6.2, 6.5, 6.7, 6.8, 6.9], color: "#6366f1" },
                { label: "Science Museum", data: [2.5, 2.7, 3.1, 3.2, 3.3, 3.5], color: "#0ea5e9" },
                { label: "History Museum", data: [4.1, 4.3, 4.2, 4.5, 4.6, 4.8], color: "#f43f5e" }
            ]
        }
    },
    {
        id: "ielts-t1-2",
        type: "Task 1",
        language: "english",
        timeLimit: 20 * 60,
        text: "The line graph below depicts the percentage of households with internet access in three different countries from 2005 to 2015. Summarize the information and make comparisons.",
        chart: {
            type: "line",
            title: "Internet Access (%) (2005-2015)",
            labels: ["2005", "2007", "2009", "2011", "2013", "2015"],
            datasets: [
                { label: "USA", data: [68, 72, 75, 78, 82, 85], color: "#6366f1" },
                { label: "UK", data: [60, 65, 71, 76, 80, 84], color: "#0ea5e9" },
                { label: "Russia", data: [15, 25, 40, 55, 68, 75], color: "#f43f5e" }
            ]
        }
    },
    {
        id: "ielts-t1-3",
        type: "Task 1",
        language: "english",
        timeLimit: 20 * 60,
        text: "The pie charts below show the distribution of energy consumption in a typical household in 2000 and 2020. Summarize the main features and make comparisons.",
        chart: {
            type: "pie",
            title: "Household Energy Consumption",
            labels: ["Heating", "Cooling", "Lighting", "Appliances"],
            datasets: [
                { label: "2000", data: [50, 10, 15, 25], color: "" }, // Multi-color pie
                { label: "2020", data: [35, 20, 10, 35], color: "" }
            ]
        }
    }
];

const IELTS_T2_PROMPTS: Prompt[] = [
    {
        id: "ielts-t2-1",
        type: "Task 2",
        language: "english",
        timeLimit: 40 * 60,
        text: "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?"
    },
    {
        id: "ielts-t2-2",
        type: "Task 2",
        language: "english",
        timeLimit: 40 * 60,
        text: "In many countries, traditional foods are being replaced by fast food. This has a negative impact on families, individuals and society. To what extent do you agree or disagree?"
    }
];

const DAF_PROMPTS: Prompt[] = [
    {
        id: "daf-t1-1",
        type: "Schriftlicher Ausdruck",
        language: "german",
        timeLimit: 60 * 60,
        text: "Immer mehr junge Menschen ziehen für das Studium in eine andere Stadt. Beschreiben Sie die Vor- und Nachteile dieser Entwicklung anhand der beiliegenden Grafik und äußern Sie Ihre eigene Meinung dazu.",
        chart: {
            type: "bar",
            title: "Studenten in anderen Städten (%)",
            labels: ["2000", "2005", "2010", "2015", "2020"],
            datasets: [
                { label: "Deutschland", data: [30, 35, 42, 48, 55], color: "#f59e0b" }
            ]
        }
    }
];

// --- Components ---

const SvgChart = ({ data }: { data: ChartData }) => {
    const { type, labels, datasets } = data;
    const width = 400;
    const height = 200;
    const padding = 40;

    if (type === "bar") {
        const barWidth = (width - padding * 2) / (labels.length * (datasets.length + 1));
        const maxVal = Math.max(...datasets.flatMap(d => d.data)) * 1.1;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-sm">
                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-700" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-700" />

                {/* Grid Lines */}
                {[0, 0.5, 1].map(tick => (
                    <line
                        key={tick}
                        x1={padding}
                        y1={padding + (height - padding * 2) * (1 - tick)}
                        x2={width - padding}
                        y2={padding + (height - padding * 2) * (1 - tick)}
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeDasharray="4"
                        className="text-zinc-200 dark:text-zinc-800"
                    />
                ))}

                {labels.map((label, i) => {
                    const groupX = padding + i * ((width - padding * 2) / labels.length);
                    return (
                        <g key={label}>
                            {datasets.map((ds, j) => {
                                const h = (ds.data[i] / maxVal) * (height - padding * 2);
                                const x = groupX + j * barWidth + barWidth / 2;
                                return (
                                    <motion.rect
                                        initial={{ height: 0, y: height - padding }}
                                        animate={{ height: h, y: height - padding - h }}
                                        key={j}
                                        x={x}
                                        width={barWidth * 0.8}
                                        fill={ds.color}
                                        rx="2"
                                    />
                                );
                            })}
                            <text x={groupX + (width - padding * 2) / (labels.length * 2)} y={height - padding + 15} textAnchor="middle" fontSize="8" className="fill-zinc-400 font-sans">{label}</text>
                        </g>
                    );
                })}
            </svg>
        );
    }

    if (type === "line") {
        const stepX = (width - padding * 2) / (labels.length - 1);
        const maxVal = Math.max(...datasets.flatMap(d => d.data)) * 1.1;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-700" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-700" />

                {datasets.map((ds, i) => {
                    const points = ds.data.map((val, idx) => {
                        const x = padding + idx * stepX;
                        const y = height - padding - (val / maxVal) * (height - padding * 2);
                        return `${x},${y}`;
                    }).join(" ");

                    return (
                        <g key={i}>
                            <motion.polyline
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                points={points}
                                fill="none"
                                stroke={ds.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {ds.data.map((val, idx) => (
                                <circle
                                    key={idx}
                                    cx={padding + idx * stepX}
                                    cy={height - padding - (val / maxVal) * (height - padding * 2)}
                                    r="3"
                                    fill="white"
                                    stroke={ds.color}
                                    strokeWidth="1.5"
                                />
                            ))}
                        </g>
                    );
                })}
                {labels.map((label, i) => (
                    <text key={i} x={padding + i * stepX} y={height - padding + 15} textAnchor="middle" fontSize="8" className="fill-zinc-400 font-sans">{label}</text>
                ))}
            </svg>
        );
    }

    if (type === "pie") {
        const colors = ["#6366f1", "#0ea5e9", "#f43f5e", "#f59e0b", "#10b981"];
        return (
            <div className="flex gap-4 justify-around py-4">
                {datasets.map((ds, dsIdx) => {
                    const total = ds.data.reduce((a, b) => a + b, 0);
                    let startAngle = 0;
                    return (
                        <div key={dsIdx} className="flex flex-col items-center gap-2">
                            <svg viewBox="0 0 100 100" className="w-24 h-24">
                                {ds.data.map((val, i) => {
                                    const percentage = (val / total) * 100;
                                    const angle = (percentage / 100) * 360;
                                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                                    const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                    const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);

                                    const largeArcFlag = angle > 180 ? 1 : 0;
                                    const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                    const path = (
                                        <motion.path
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={i}
                                            d={d}
                                            fill={colors[i % colors.length]}
                                        />
                                    );
                                    startAngle += angle;
                                    return path;
                                })}
                            </svg>
                            <span className="text-xs font-bold text-zinc-500">{ds.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
};

// --- Main Component ---

export default function WritingSimulator() {
    const [module, setModule] = useState<"english" | "german">("english");
    const [taskType, setTaskType] = useState<"Task 1" | "Task 2">("Task 1");

    // Logic for "Daily Prompt" (now used to pick the specific prompt from the pool)
    const activePrompt = useMemo(() => {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

        if (module === "english") {
            const pool = taskType === "Task 1" ? IELTS_T1_PROMPTS : IELTS_T2_PROMPTS;
            return pool[seed % pool.length];
        } else {
            return DAF_PROMPTS[seed % DAF_PROMPTS.length];
        }
    }, [module, taskType]);
    const [text, setText] = useState("");
    const [timeLeft, setTimeLeft] = useState(activePrompt.timeLimit);
    const [isRunning, setIsRunning] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [score, setScore] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset when prompt changes
    useEffect(() => {
        resetSimulation(activePrompt.timeLimit);
    }, [activePrompt]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev: number) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            handleSubmit();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleModuleChange = (newModule: "english" | "german") => {
        setModule(newModule);
        setError(null);
    };

    const resetSimulation = (newTimeLine = activePrompt.timeLimit) => {
        setIsRunning(false);
        setText("");
        setTimeLeft(newTimeLine);
        setFeedback(null);
        setScore(null);
        setError(null);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    const handleSubmit = async () => {
        if (wordCount < 10) return;

        setIsRunning(false);
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/practice/writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: activePrompt.text,
                    language: module,
                    text,
                    type: activePrompt.type
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFeedback(data.feedback);
                setScore(data.score);
            } else {
                setError(data.error || "Ошибка при проверке эссе");
            }
        } catch (error) {
            console.error(error);
            setError("Не удалось соединиться с сервером ИИ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            {/* Header and Controls */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm w-full flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-8 h-8 text-sky-500" />
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">
                            Симулятор письма
                        </h2>
                    </div>
                    <p className="text-zinc-500 text-sm">Тренировка {activePrompt.type}. Задание обновляется ежедневно.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {module === "english" && (
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setTaskType("Task 1")}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${taskType === "Task 1" ? "bg-white dark:bg-zinc-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-zinc-500"}`}
                            >
                                Task 1 (Charts)
                            </button>
                            <button
                                onClick={() => setTaskType("Task 2")}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${taskType === "Task 2" ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}
                            >
                                Task 2 (Essay)
                            </button>
                        </div>
                    )}

                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => handleModuleChange("english")}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${module === "english" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                        >
                            IELTS
                        </button>
                        <button
                            onClick={() => handleModuleChange("german")}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${module === "german" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                        >
                            Goethe-Zertifikat
                        </button>
                    </div>

                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Gemini AI Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Prompt & Visuals */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Timer Card */}
                    <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 group-hover:opacity-100 transition-opacity" />

                        <Clock className={`w-10 h-10 mb-4 transition-all duration-1000 ${isRunning ? 'animate-[spin_10s_linear_infinite] text-sky-400 scale-110' : 'text-zinc-600'}`} />
                        <div className={`text-6xl font-black font-mono tracking-tighter mb-6 relative z-10 ${timeLeft < 300 && isRunning ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </div>

                        <div className="flex gap-3 w-full relative z-10">
                            {isRunning ? (
                                <button
                                    onClick={() => setIsRunning(false)}
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10"
                                >
                                    PAUSE
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsRunning(true)}
                                    disabled={timeLeft === 0 || isSubmitting || !!feedback}
                                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50"
                                >
                                    START
                                </button>
                            )}
                            <button
                                onClick={() => resetSimulation()}
                                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Prompt & Visuals Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full text-xs font-black uppercase tracking-wider">
                                {activePrompt.type}
                            </span>
                            <span className="text-zinc-400 text-xs font-medium">• 25 февраля</span>
                        </div>

                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-serif text-lg">
                            {activePrompt.text}
                        </p>

                        {activePrompt.chart && (
                            <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
                                    {activePrompt.chart.type === 'bar' && <BarChart3 className="w-4 h-4" />}
                                    {activePrompt.chart.type === 'pie' && <PieChart className="w-4 h-4" />}
                                    {activePrompt.chart.type === 'line' && <Activity className="w-4 h-4" />}
                                    <span className="text-xs font-bold uppercase tracking-tight">{activePrompt.chart.title}</span>
                                </div>
                                <SvgChart data={activePrompt.chart} />

                                {/* Legend */}
                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                                    {activePrompt.chart.datasets.map((ds, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color || '#6366f1' }} />
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{ds.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Editor & Feedback */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {!feedback ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[700px] relative">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        Мерцающий курсор
                                        <div className="w-1.5 h-4 bg-sky-500 animate-pulse" />
                                    </span>
                                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                                    <span className={`text-sm font-medium transition-colors ${wordCount < 150 ? 'text-zinc-400' : 'text-emerald-500 font-bold'}`}>
                                        {wordCount} слов
                                    </span>
                                </div>
                            </div>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={!isRunning || isSubmitting}
                                placeholder={isRunning ? "Начните вводить текст вашего эссе..." : "Для активации редактора запустите таймер слева."}
                                className="flex-1 w-full p-8 resize-none focus:outline-none bg-transparent text-zinc-900 dark:text-zinc-100 text-lg leading-relaxed font-serif disabled:opacity-50"
                            />

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-4 items-center">
                                {error && <span className="text-rose-500 text-sm font-bold animate-shake">{error}</span>}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!isRunning || wordCount < 10 || isSubmitting}
                                    className="flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:translate-y-0 active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Анализ эссе...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Сдать работу</>
                                    )}
                                </button>
                            </div>

                            {/* Lock Overlay */}
                            {!isRunning && !isSubmitting && text.length === 0 && (
                                <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[4px] z-10 flex items-center justify-center p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-sm"
                                    >
                                        <div className="w-20 h-20 bg-sky-100 dark:bg-sky-950/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Clock className="w-10 h-10 text-sky-500" />
                                        </div>
                                        <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Готовы к тесту?</h4>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                            Таймер имитирует реальные условия экзамена. Вы не сможете печатать, пока он не запущен.
                                        </p>
                                        <button
                                            onClick={() => setIsRunning(true)}
                                            className="w-full py-4 bg-sky-500 rounded-2xl text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
                                        >
                                            Начать практику
                                        </button>
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[700px]"
                            >
                                <div className="p-8 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/10 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-none">Результат ИИ</h3>
                                            <p className="text-emerald-600/80 font-bold text-xs uppercase tracking-widest mt-1">Проверка завершена успешно</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-800 px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Ожидаемый балл</span>
                                        <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{score || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="flex-1 p-8 overflow-y-auto w-full prose prose-zinc dark:prose-invert max-w-none scroll-smooth">
                                    <div
                                        className="evaluate-html-content"
                                        dangerouslySetInnerHTML={{ __html: feedback.replace(/\\n/g, '<br/>') }}
                                    />
                                </div>

                                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                    <p className="text-xs text-zinc-400 max-w-[200px]">Результат сохранен в вашу историю практики для дальнейшего анализа.</p>
                                    <button
                                        onClick={() => resetSimulation()}
                                        className="flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black rounded-2xl transition-all shadow-lg active:scale-95"
                                    >
                                        <RefreshCcw className="w-5 h-5" /> Новое задание
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div >
    );
}
