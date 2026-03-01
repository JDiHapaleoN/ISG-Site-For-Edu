"use client";

import { Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useTimer, Subject } from "@/hooks/useTimer";

export default function PomodoroTimer() {
    const {
        state,
        subject,
        timeLeft,
        completedSessions,
        setSubject,
        toggleTimer,
        resetTimer
    } = useTimer();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getSubjectColor = () => {
        if (state === "resting") return "text-emerald-500";
        switch (subject) {
            case "english": return "text-indigo-500";
            case "german": return "text-pink-500";
            case "math": return "text-rose-500";
            default: return "text-zinc-500";
        }
    };

    const getSubjectBg = () => {
        if (state === "resting") return "from-emerald-500/20 to-teal-500/20";
        switch (subject) {
            case "english": return "from-indigo-500/20 to-blue-500/20";
            case "german": return "from-pink-500/20 to-rose-500/20";
            case "math": return "from-rose-500/20 to-orange-500/20";
            default: return "from-zinc-500/20 to-zinc-400/20";
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm w-full relative overflow-hidden flex flex-col items-center">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getSubjectBg()} opacity-50 transition-colors duration-1000`} />

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="flex w-full justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        {state === "resting" ? <Coffee className="w-5 h-5 text-emerald-500" /> : <BookOpen className={`w-5 h-5 ${getSubjectColor()}`} />}
                        Таймер фокуса
                    </h3>
                    <span className="text-sm font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-300 shadow-inner">
                        {completedSessions} сессий
                    </span>
                </div>

                {/* Subject Select */}
                <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 w-full max-w-[280px]">
                    {(["english", "german", "math"] as Subject[]).map((s) => (
                        <button
                            key={s}
                            disabled={state !== "idle"}
                            onClick={() => setSubject(s)}
                            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${subject === s
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {s === 'english' ? 'Английский' : s === 'german' ? 'Немецкий' : 'Математика'}
                        </button>
                    ))}
                </div>

                {/* Timer Display */}
                <div className="relative flex justify-center items-center mb-8">
                    <motion.svg width="240" height="240" viewBox="0 0 240 240">
                        <circle
                            cx="120" cy="120" r="110"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-zinc-200 dark:text-zinc-800"
                        />
                        <motion.circle
                            cx="120" cy="120" r="110"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={getSubjectColor()}
                            initial={{ pathLength: 1 }}
                            animate={{ pathLength: timeLeft / (state === "resting" ? 300 : 1500) }}
                            transition={{ duration: 1, ease: "linear" }}
                            style={{ rotate: -90, transformOrigin: "50% 50%" }}
                        />
                    </motion.svg>

                    <div className="absolute flex flex-col items-center">
                        <span className={`text-6xl font-black font-mono tracking-tighter ${getSubjectColor()}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 mt-2">
                            {state === "idle" ? "Ready" : state === "studying" ? "Focus" : "Break"}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <button
                        onClick={toggleTimer}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${state === "resting" ? 'bg-emerald-500' :
                            subject === 'english' ? 'bg-indigo-500' :
                                subject === 'german' ? 'bg-pink-500' : 'bg-rose-500'
                            }`}
                    >
                        {state !== "idle" ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
