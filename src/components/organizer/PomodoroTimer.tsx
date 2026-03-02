"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Coffee, Brain } from "lucide-react";

interface PomodoroTimerProps {
    completedToday: number;
    addPomodoroSession: () => void;
}

const WORK_TIME = 25 * 60; // 25 min
const SHORT_BREAK = 5 * 60; // 5 min
const LONG_BREAK = 15 * 60; // 15 min

type Phase = "work" | "short_break" | "long_break";

const PHASE_CONFIG: Record<Phase, { label: string; duration: number; color: string }> = {
    work: { label: "Фокус", duration: WORK_TIME, color: "text-indigo-500" },
    short_break: { label: "Короткий перерыв", duration: SHORT_BREAK, color: "text-emerald-500" },
    long_break: { label: "Длинный перерыв", duration: LONG_BREAK, color: "text-amber-500" },
};

export default function PomodoroTimer({ completedToday, addPomodoroSession }: PomodoroTimerProps) {
    const [phase, setPhase] = useState<Phase>("work");
    const [timeLeft, setTimeLeft] = useState(WORK_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [noiseEnabled, setNoiseEnabled] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    const totalSeconds = PHASE_CONFIG[phase].duration;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

    // Timer logic
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        if (phase === "work") {
                            addPomodoroSession();
                            const nextPhase = (completedToday + 1) % 4 === 0 ? "long_break" : "short_break";
                            setPhase(nextPhase);
                            return PHASE_CONFIG[nextPhase].duration;
                        } else {
                            setPhase("work");
                            return WORK_TIME;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, phase, completedToday, addPomodoroSession]);

    // White noise via Web Audio API
    const startNoise = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const gain = ctx.createGain();
            gain.gain.value = 0.08; // very soft

            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();

            audioCtxRef.current = ctx;
            noiseNodeRef.current = source;
            gainRef.current = gain;
        } catch (e) {
            console.error("Web Audio API error:", e);
        }
    }, []);

    const stopNoise = useCallback(() => {
        try {
            noiseNodeRef.current?.stop();
            audioCtxRef.current?.close();
        } catch { /* ignore */ }
        audioCtxRef.current = null;
        noiseNodeRef.current = null;
        gainRef.current = null;
    }, []);

    const toggleNoise = () => {
        if (noiseEnabled) {
            stopNoise();
        } else {
            startNoise();
        }
        setNoiseEnabled(!noiseEnabled);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopNoise();
    }, [stopNoise]);

    const reset = () => {
        setIsRunning(false);
        setTimeLeft(PHASE_CONFIG[phase].duration);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-8 py-8">
            {/* Phase Selector */}
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                {(Object.keys(PHASE_CONFIG) as Phase[]).map(p => (
                    <button
                        key={p}
                        onClick={() => {
                            setPhase(p);
                            setTimeLeft(PHASE_CONFIG[p].duration);
                            setIsRunning(false);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${phase === p
                            ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                    >
                        {PHASE_CONFIG[p].label}
                    </button>
                ))}
            </div>

            {/* Ring Timer */}
            <div className="relative w-72 h-72 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" width="288" height="288" viewBox="0 0 288 288">
                    <circle cx="144" cy="144" r={radius} fill="none" stroke="currentColor" strokeWidth="8"
                        className="text-zinc-200 dark:text-zinc-800" />
                    <circle cx="144" cy="144" r={radius} fill="none" strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        className={PHASE_CONFIG[phase].color}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset,
                            transition: "stroke-dashoffset 1s linear",
                        }}
                    />
                </svg>
                <div className="flex flex-col items-center gap-2 z-10">
                    <span className={`${PHASE_CONFIG[phase].color}`}>
                        {phase === "work" ? <Brain className="w-6 h-6" /> : <Coffee className="w-6 h-6" />}
                    </span>
                    <span className="text-5xl font-black tabular-nums text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {PHASE_CONFIG[phase].label}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={reset}
                    className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-xl transition-all hover:-translate-y-0.5 ${isRunning
                        ? "bg-rose-500 shadow-rose-500/30"
                        : "bg-indigo-600 shadow-indigo-500/30"
                        }`}
                >
                    {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>
                <button
                    onClick={toggleNoise}
                    className={`p-3 rounded-xl transition-colors ${noiseEnabled
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                    title="Белый шум"
                >
                    {noiseEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 w-full max-w-sm text-center">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{completedToday}</p>
                <p className="text-sm text-zinc-500 mt-1 font-medium">
                    {completedToday === 1 ? "Помодоро сессия" : "Помодоро сессий"} сегодня
                </p>
            </div>
        </div>
    );
}
