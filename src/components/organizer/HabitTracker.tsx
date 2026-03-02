"use client";

import { useState } from "react";
import { Plus, Trash2, Flame, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Habit } from "@/hooks/useOrganizer";

interface HabitTrackerProps {
    habits: Habit[];
    addHabit: (name: string) => void;
    toggleHabitToday: (id: string) => void;
    deleteHabit: (id: string) => void;
    getStreak: (habit: Habit) => number;
}

export default function HabitTracker({ habits, addHabit, toggleHabitToday, deleteHabit, getStreak }: HabitTrackerProps) {
    const [input, setInput] = useState("");
    const today = new Date().toISOString().slice(0, 10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        addHabit(input.trim());
        setInput("");
    };

    // Last 7 days for the mini heatmap
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
    });

    const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    return (
        <div className="space-y-6">
            {/* Add Habit */}
            <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder='Новая привычка (например: "Пить воду")'
                    className="flex-1 h-14 px-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-sans text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                    type="submit"
                    className="h-14 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            {/* Habits Grid */}
            <AnimatePresence mode="popLayout">
                {habits.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 text-zinc-400"
                    >
                        <Flame className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Нет привычек</p>
                        <p className="text-sm mt-1">Добавьте первую привычку для отслеживания 🔥</p>
                    </motion.div>
                ) : (
                    habits.map(habit => {
                        const streak = getStreak(habit);
                        const isDoneToday = habit.completedDates.includes(today);

                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <button
                                            onClick={() => toggleHabitToday(habit.id)}
                                            className={`w-10 h-10 flex-shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${isDoneToday
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                : "border-zinc-300 dark:border-zinc-700 hover:border-emerald-500"
                                                }`}
                                        >
                                            {isDoneToday && <Check className="w-5 h-5 stroke-[3]" />}
                                        </button>
                                        <div className="min-w-0">
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{habit.name}</p>
                                            {streak > 0 && (
                                                <p className="flex items-center gap-1 text-sm text-amber-500 font-bold">
                                                    <Flame className="w-3.5 h-3.5" />
                                                    {streak} {streak === 1 ? "день" : "дней"} подряд
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteHabit(habit.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-500 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Mini Heatmap (last 7 days) */}
                                <div className="flex gap-1.5">
                                    {last7Days.map((dateStr, i) => {
                                        const done = habit.completedDates.includes(dateStr);
                                        const dayIndex = new Date(dateStr + "T12:00:00").getDay();
                                        const dayName = DAY_NAMES[dayIndex === 0 ? 6 : dayIndex - 1];
                                        return (
                                            <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-zinc-400 font-bold">{dayName}</span>
                                                <div
                                                    className={`w-full aspect-square rounded-lg transition-all ${done
                                                        ? "bg-emerald-500 shadow-sm"
                                                        : "bg-zinc-100 dark:bg-zinc-800"
                                                        }`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>
    );
}
