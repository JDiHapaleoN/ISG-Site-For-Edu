"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, Flag, Check, Filter } from "lucide-react";
import { Task, Priority } from "@/hooks/useOrganizer";

interface TaskManagerProps {
    tasks: Task[];
    addTask: (text: string, priority?: Priority, deadline?: string | null) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    updateTaskPriority: (id: string, priority: Priority) => void;
    updateTaskDeadline: (id: string, deadline: string | null) => void;
}

const PRIORITY_CONFIG: Record<Priority, { emoji: string; color: string; label: string }> = {
    high: { emoji: "🔴", color: "text-rose-500", label: "Высокий" },
    medium: { emoji: "🟡", color: "text-amber-500", label: "Средний" },
    low: { emoji: "🟢", color: "text-emerald-500", label: "Низкий" },
};

type FilterType = "all" | "active" | "completed";

export default function TaskManager({
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskPriority,
}: TaskManagerProps) {
    const [input, setInput] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [filter, setFilter] = useState<FilterType>("all");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        addTask(input, priority);
        setInput("");
        setPriority("medium");
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
    });

    const activeTasks = tasks.filter(t => !t.completed).length;

    const formatDeadline = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return `Сегодня, ${d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}`;
        if (d.toDateString() === tomorrow.toDateString()) return `Завтра, ${d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}`;
        return d.toLocaleDateString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6">
            {/* Input */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder='Напишите задачу... (например: "купить хлеб завтра в 10")'
                        className="w-full h-14 px-5 pr-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-sans text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const priorities: Priority[] = ["low", "medium", "high"];
                            const idx = priorities.indexOf(priority);
                            setPriority(priorities[(idx + 1) % 3]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform"
                        title={`Приоритет: ${PRIORITY_CONFIG[priority].label}`}
                    >
                        {PRIORITY_CONFIG[priority].emoji}
                    </button>
                </div>
                <button
                    type="submit"
                    className="h-14 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Добавить</span>
                </button>
            </form>

            {/* Filters & Counter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                    {(["all", "active", "completed"] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f
                                ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            {f === "all" ? "Все" : f === "active" ? "Активные" : "Готовые"}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-zinc-500 font-medium">
                    {activeTasks} {activeTasks === 1 ? "задача" : "задач"} осталось
                </span>
            </div>

            {/* Task List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 text-zinc-400"
                        >
                            <Filter className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">Нет задач</p>
                            <p className="text-sm mt-1">Добавьте первую задачу выше ☝️</p>
                        </motion.div>
                    ) : (
                        filteredTasks.map(task => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className={`group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md ${task.completed ? "opacity-60" : ""}`}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "border-zinc-300 dark:border-zinc-700 hover:border-indigo-500"
                                        }`}
                                >
                                    {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-base font-medium truncate ${task.completed ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"}`}>
                                        {task.text}
                                    </p>
                                    {task.deadline && (
                                        <p className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDeadline(task.deadline)}
                                        </p>
                                    )}
                                </div>

                                {/* Priority toggle */}
                                <button
                                    onClick={() => {
                                        const order: Priority[] = ["low", "medium", "high"];
                                        const idx = order.indexOf(task.priority);
                                        updateTaskPriority(task.id, order[(idx + 1) % 3]);
                                    }}
                                    className="flex-shrink-0 text-lg hover:scale-110 transition-transform"
                                    title={PRIORITY_CONFIG[task.priority].label}
                                >
                                    {PRIORITY_CONFIG[task.priority].emoji}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
