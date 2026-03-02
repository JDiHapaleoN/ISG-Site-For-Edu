"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Task, Priority } from "@/hooks/useOrganizer";

interface CalendarViewProps {
    tasks: Task[];
    addTask: (text: string, priority?: Priority, deadline?: string | null) => void;
    toggleTask: (id: string) => void;
}

const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function CalendarView({ tasks, addTask, toggleTask }: CalendarViewProps) {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newTaskText, setNewTaskText] = useState("");

    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDay = firstDay.getDay() - 1; // Monday = 0
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Tasks grouped by date YYYY-MM-DD
    const tasksByDate: Record<string, Task[]> = {};
    tasks.forEach(t => {
        if (t.deadline) {
            const dateStr = new Date(t.deadline).toISOString().slice(0, 10);
            if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
            tasksByDate[dateStr].push(t);
        }
    });

    const todayStr = today.toISOString().slice(0, 10);

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    // Selected date tasks
    const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];

    const handleAddTaskForDate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim() || !selectedDate) return;
        const deadline = new Date(selectedDate + "T23:59:00").toISOString();
        addTask(newTaskText, "medium", deadline);
        setNewTaskText("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {MONTHS_RU[viewMonth]} {viewYear}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
                {DAYS_RU.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;

                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayTasks = tasksByDate[dateStr] || [];
                    const hasHighPriority = dayTasks.some(t => t.priority === "high" && !t.completed);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                            className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all ${isSelected
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : isToday
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/30"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                                }`}
                        >
                            {day}
                            {dayTasks.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {dayTasks.slice(0, 3).map((t, j) => (
                                        <div
                                            key={j}
                                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : hasHighPriority ? "bg-rose-500" : "bg-indigo-500"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Detail */}
            {selectedDate && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        📅 {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" })}
                    </h4>

                    {selectedTasks.length === 0 ? (
                        <p className="text-sm text-zinc-400">Нет задач на этот день</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleTask(t.id)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${t.completed
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-zinc-300 dark:border-zinc-700"
                                            }`}
                                    >
                                        {t.completed && <span className="text-xs">✓</span>}
                                    </button>
                                    <span className={`text-sm ${t.completed ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                                        {t.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick add */}
                    <form onSubmit={handleAddTaskForDate} className="flex gap-2">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={e => setNewTaskText(e.target.value)}
                            placeholder="Новая задача..."
                            className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
