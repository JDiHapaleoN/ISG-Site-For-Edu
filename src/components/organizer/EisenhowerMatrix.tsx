"use client";

import { useMemo } from "react";
import { Task } from "@/hooks/useOrganizer";
import { AlertTriangle, Target, Clock, Archive } from "lucide-react";

interface EisenhowerMatrixProps {
    tasks: Task[];
    toggleTask: (id: string) => void;
}

interface Quadrant {
    key: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    iconColor: string;
}

const QUADRANTS: Quadrant[] = [
    {
        key: "urgent-important",
        title: "🔥 Сделать сейчас",
        subtitle: "Срочно и Важно",
        icon: <AlertTriangle className="w-5 h-5" />,
        bgColor: "bg-rose-50 dark:bg-rose-950/30",
        borderColor: "border-rose-200 dark:border-rose-900/50",
        iconColor: "text-rose-500",
    },
    {
        key: "not-urgent-important",
        title: "📅 Запланировать",
        subtitle: "Важно, но не Срочно",
        icon: <Target className="w-5 h-5" />,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-900/50",
        iconColor: "text-blue-500",
    },
    {
        key: "urgent-not-important",
        title: "👥 Делегировать",
        subtitle: "Срочно, но не Важно",
        icon: <Clock className="w-5 h-5" />,
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-900/50",
        iconColor: "text-amber-500",
    },
    {
        key: "not-urgent-not-important",
        title: "🗑️ Отложить",
        subtitle: "Не Срочно и не Важно",
        icon: <Archive className="w-5 h-5" />,
        bgColor: "bg-zinc-50 dark:bg-zinc-900/50",
        borderColor: "border-zinc-200 dark:border-zinc-800",
        iconColor: "text-zinc-400",
    },
];

export default function EisenhowerMatrix({ tasks, toggleTask }: EisenhowerMatrixProps) {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUADRANTS.map(q => (
                <div
                    key={q.key}
                    className={`${q.bgColor} ${q.borderColor} border rounded-2xl p-5 space-y-3 min-h-[200px]`}
                >
                    <div className="flex items-center gap-2">
                        <span className={q.iconColor}>{q.icon}</span>
                        <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{q.title}</h4>
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{q.subtitle}</p>
                        </div>
                    </div>

                    {categorized[q.key].length === 0 ? (
                        <p className="text-sm text-zinc-400 italic py-4 text-center">Пусто</p>
                    ) : (
                        <div className="space-y-2">
                            {categorized[q.key].map(task => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-2 p-2.5 bg-white/70 dark:bg-zinc-950/50 rounded-xl"
                                >
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className="w-5 h-5 flex-shrink-0 rounded border-2 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 transition-colors"
                                    />
                                    <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">
                                        {task.text}
                                    </span>
                                    {task.deadline && (
                                        <span className="text-[10px] text-zinc-400 ml-auto flex-shrink-0">
                                            {new Date(task.deadline).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
