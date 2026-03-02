"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority } from "@/hooks/useOrganizer";
import { AlertTriangle, Target, Clock, Archive, Check, Trash2, Flag, Calendar } from "lucide-react";

interface EisenhowerMatrixProps {
    tasks: Task[];
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    updateTaskPriority: (id: string, priority: Priority) => void;
    updateTaskDeadline: (id: string, deadline: string | null) => void;
}

interface QuadrantConfig {
    key: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    iconColor: string;
    accent: string;
}

const QUADRANTS: QuadrantConfig[] = [
    {
        key: "urgent-important",
        title: "🔥 Сделать сейчас",
        subtitle: "Срочно + Важно",
        icon: <AlertTriangle className="w-5 h-5" />,
        bg: "bg-rose-50 dark:bg-rose-950/30",
        border: "border-rose-200 dark:border-rose-900/50",
        iconColor: "text-rose-500",
        accent: "bg-rose-500",
    },
    {
        key: "not-urgent-important",
        title: "📅 Запланировать",
        subtitle: "Важно, не Срочно",
        icon: <Target className="w-5 h-5" />,
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-900/50",
        iconColor: "text-blue-500",
        accent: "bg-blue-500",
    },
    {
        key: "urgent-not-important",
        title: "👥 Делегировать",
        subtitle: "Срочно, не Важно",
        icon: <Clock className="w-5 h-5" />,
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-900/50",
        iconColor: "text-amber-500",
        accent: "bg-amber-500",
    },
    {
        key: "not-urgent-not-important",
        title: "🗑️ Отложить",
        subtitle: "Не Срочно, не Важно",
        icon: <Archive className="w-5 h-5" />,
        bg: "bg-zinc-50 dark:bg-zinc-900/50",
        border: "border-zinc-200 dark:border-zinc-800",
        iconColor: "text-zinc-400",
        accent: "bg-zinc-400",
    },
];

const PRIORITY_EMOJI: Record<Priority, string> = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
};

export default function EisenhowerMatrix({
    tasks,
    toggleTask,
    deleteTask,
    updateTaskPriority,
    updateTaskDeadline,
}: EisenhowerMatrixProps) {
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    const categorized = useMemo(() => {
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const result: Record<string, Task[]> = {
            "urgent-important": [],
            "not-urgent-important": [],
            "urgent-not-important": [],
            "not-urgent-not-important": [],
        };

        tasks
            .filter(t => !t.completed)
            .forEach(task => {
                const isImportant = task.priority === "high";
                const isUrgent = task.deadline ? new Date(task.deadline) <= in48h : false;

                if (isImportant && isUrgent) result["urgent-important"].push(task);
                else if (isImportant && !isUrgent) result["not-urgent-important"].push(task);
                else if (!isImportant && isUrgent) result["urgent-not-important"].push(task);
                else result["not-urgent-not-important"].push(task);
            });

        return result;
    }, [tasks]);

    const totalActive = tasks.filter(t => !t.completed).length;

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-3 flex-wrap">
                {QUADRANTS.map(q => (
                    <div key={q.key} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${q.accent}`} />
                        <span className="text-xs font-bold text-zinc-500">{categorized[q.key].length}</span>
                    </div>
                ))}
                <span className="ml-auto text-xs text-zinc-400 font-medium">{totalActive} задач активно</span>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {QUADRANTS.map(q => (
                    <div
                        key={q.key}
                        className={`${q.bg} ${q.border} border rounded-2xl p-4 space-y-2 min-h-[180px]`}
                    >
                        {/* Quadrant header */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={q.iconColor}>{q.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{q.title}</h4>
                                <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest">{q.subtitle}</p>
                            </div>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${q.accent} text-white`}>
                                {categorized[q.key].length}
                            </span>
                        </div>

                        {/* Tasks */}
                        <AnimatePresence mode="popLayout">
                            {categorized[q.key].length === 0 ? (
                                <p className="text-sm text-zinc-400 italic py-6 text-center">Пусто</p>
                            ) : (
                                categorized[q.key].map(task => {
                                    const isExpanded = expandedTask === task.id;

                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white/80 dark:bg-zinc-950/60 rounded-xl overflow-hidden"
                                        >
                                            {/* Main row */}
                                            <div
                                                className="flex items-center gap-2 p-2.5 cursor-pointer"
                                                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                            >
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                                    className="w-5 h-5 flex-shrink-0 rounded border-2 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 transition-colors flex items-center justify-center"
                                                >
                                                    {task.completed && <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />}
                                                </button>
                                                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">
                                                    {task.text}
                                                </span>
                                                {task.deadline && (
                                                    <span className="text-[10px] text-zinc-400 flex-shrink-0">
                                                        {new Date(task.deadline).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Expanded actions */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                                    >
                                                        <div className="p-2.5 flex items-center gap-2 flex-wrap">
                                                            {/* Priority toggle */}
                                                            <div className="flex items-center gap-1">
                                                                <Flag className="w-3 h-3 text-zinc-400" />
                                                                {(["high", "medium", "low"] as Priority[]).map(p => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={() => updateTaskPriority(task.id, p)}
                                                                        className={`text-sm px-1.5 py-0.5 rounded-md transition-all ${task.priority === p
                                                                            ? "bg-zinc-200 dark:bg-zinc-800 scale-110"
                                                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                                                            }`}
                                                                    >
                                                                        {PRIORITY_EMOJI[p]}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Deadline picker */}
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                <Calendar className="w-3 h-3 text-zinc-400" />
                                                                <input
                                                                    type="date"
                                                                    value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        updateTaskDeadline(task.id, val ? new Date(val + "T23:59:00").toISOString() : null);
                                                                    }}
                                                                    className="text-xs bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-[120px]"
                                                                />
                                                            </div>

                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => deleteTask(task.id)}
                                                                className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
