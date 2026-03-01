"use client";

import { useTimer } from "@/hooks/useTimer";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Maximize2, Coffee, BookOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function GlobalTimer() {
    const { state, timeLeft, subject, toggleTimer } = useTimer();
    const pathname = usePathname();
    const router = useRouter();

    // Show if not idle (visible when studying, resting, or paused)
    if (state === "idle") {
        return null;
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getSubjectColorBg = () => {
        if (state === "resting") return "bg-emerald-500 text-white";
        if (state === "paused") return "bg-zinc-500 text-white";
        switch (subject) {
            case "english": return "bg-indigo-600 text-white";
            case "german": return "bg-pink-600 text-white";
            case "math": return "bg-rose-600 text-white";
            default: return "bg-zinc-800 text-white";
        }
    };

    const getSubjectLabel = () => {
        if (state === "resting") return "Отдых";
        if (state === "paused") return "Пауза";
        switch (subject) {
            case "english": return "Англ";
            case "german": return "Нем";
            case "math": return "Мат";
            default: return "Фокус";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-[60] pointer-events-auto"
            >
                {/* Floating Widget */}
                <div className={`relative flex items-center gap-3 p-1.5 pl-4 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl ${getSubjectColorBg()} transition-all duration-300`}>

                    {/* Status Info */}
                    <div className="flex flex-col -space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                            {getSubjectLabel()}
                        </span>
                        <span className="font-mono text-lg font-black tracking-tighter">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTimer();
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                            title={state === "studying" ? "Пауза" : "Старт"}
                        >
                            {state === "studying" || state === "resting" ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>

                        {pathname !== "/" && (
                            <button
                                onClick={() => router.push("/")}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/10 hover:bg-black/20 transition-colors"
                                title="Открыть таймер"
                            >
                                <Maximize2 className="w-4 h-4 text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
