"use client";

import { useTimer } from "@/hooks/useTimer";
import { Play, Pause, Coffee, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function GlobalTimer() {
    const { state, subject, timeLeft, toggleTimer } = useTimer();
    const pathname = usePathname();

    // On the dashboard (where the big timer is), we don't need to show the floating timer.
    const isDashboard = pathname === "/";

    if (isDashboard || state === "idle") {
        return null;
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getSubjectColorBg = () => {
        if (state === "resting") return "bg-emerald-500 text-white";
        switch (subject) {
            case "english": return "bg-indigo-500 text-white";
            case "german": return "bg-pink-500 text-white";
            case "math": return "bg-rose-500 text-white";
            default: return "bg-zinc-800 text-white";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-4 right-6 z-50 pointer-events-auto"
            >
                <div className={`shadow-xl rounded-full px-4 py-2 flex items-center gap-3 border border-white/20 backdrop-blur-md ${getSubjectColorBg()}`}>
                    {state === "resting" ? <Coffee className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}

                    <span className="font-mono font-bold tracking-tighter">
                        {formatTime(timeLeft)}
                    </span>

                    <button
                        onClick={toggleTimer}
                        className="hover:scale-110 active:scale-95 transition-transform bg-white/20 p-1 rounded-full"
                    >
                        {state === "studying" || state === "resting" ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
