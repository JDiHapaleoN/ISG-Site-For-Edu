"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, CalendarDays, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority } from "@/hooks/useOrganizer";

interface CalendarViewProps {
    tasks: Task[];
    addTask: (text: string, priority?: Priority, deadline?: string | null) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
}

const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const PRIORITY_COLORS: Record<Priority, string> = {
    high: "bg-rose-500",
    medium: "bg-indigo-500",
    low: "bg-emerald-500",
};

const PRIORITY_BORDER: Record<Priority, string> = {
    high: "border-l-rose-500",
    medium: "border-l-indigo-500",
    low: "border-l-emerald-500",
};

type ViewMode = "month" | "week";

export default function CalendarView({ tasks, addTask, toggleTask, deleteTask }: CalendarViewProps) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [newTaskText, setNewTaskText] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("month");

    // Navigate
    const prevPeriod = () => {
        if (viewMode === "week") {
            const d = new Date(viewYear, viewMonth, 1);
            d.setDate(d.getDate() - 7);
            setViewMonth(d.getMonth());
            setViewYear(d.getFullYear());
        } else {
            if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
            else setViewMonth(m => m - 1);
        }
    };
    const nextPeriod = () => {
        if (viewMode === "week") {
            const d = new Date(viewYear, viewMonth, 1);
            d.setDate(d.getDate() + 7);
            setViewMonth(d.getMonth());
            setViewYear(d.getFullYear());
        } else {
            if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
            else setViewMonth(m => m + 1);
        }
    };
    const goToday = () => {
        setViewMonth(today.getMonth());
        setViewYear(today.getFullYear());
        setSelectedDate(todayStr);
    };

    // Tasks grouped by date
    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {};
        tasks.forEach(t => {
            if (t.deadline) {
                const dateStr = new Date(t.deadline).toISOString().slice(0, 10);
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(t);
            }
        });
        return map;
    }, [tasks]);

    // Calendar grid cells
    const cells = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        const result: (number | null)[] = [];
        for (let i = 0; i < startDay; i++) result.push(null);
        for (let d = 1; d <= daysInMonth; d++) result.push(d);
        // Pad to complete last row
        while (result.length % 7 !== 0) result.push(null);
        return result;
    }, [viewMonth, viewYear]);

    // Week view: 7 days around the current month start
    const weekDays = useMemo(() => {
        const start = new Date(viewYear, viewMonth, 1);
        const dayOfWeek = start.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(start);
        monday.setDate(start.getDate() + mondayOffset);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return {
                date: d,
                dateStr: d.toISOString().slice(0, 10),
                day: d.getDate(),
                dayName: DAYS_RU[i],
                isToday: d.toISOString().slice(0, 10) === todayStr,
            };
        });
    }, [viewMonth, viewYear, todayStr]);

    // Selected date tasks
    const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim() || !selectedDate) return;
        const deadline = new Date(selectedDate + "T23:59:00").toISOString();
        addTask(newTaskText, "medium", deadline);
        setNewTaskText("");
    };

    const makeDateStr = (day: number) =>
        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return (
        <div className="space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={prevPeriod} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center">
                        {MONTHS_RU[viewMonth]} {viewYear}
                    </h3>
                    <button onClick={nextPeriod} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                        Сегодня
                    </button>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode("month")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "month" ? "bg-white dark:bg-zinc-700 shadow-sm" : ""}`}
                            title="Месяц"
                        >
                            <CalendarDays className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("week")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "week" ? "bg-white dark:bg-zinc-700 shadow-sm" : ""}`}
                            title="Неделя"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── MONTH VIEW ─── */}
            {viewMode === "month" && (
                <div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7">
                        {DAYS_RU.map(d => (
                            <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 border-t border-l border-zinc-200 dark:border-zinc-800">
                        {cells.map((day, i) => {
                            if (day === null) {
                                return <div key={`e-${i}`} className="border-r border-b border-zinc-200 dark:border-zinc-800 min-h-[60px] sm:min-h-[90px]" />;
                            }

                            const dateStr = makeDateStr(day);
                            const isToday = dateStr === todayStr;
                            const isSelected = dateStr === selectedDate;
                            const dayTasks = tasksByDate[dateStr] || [];

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`border-r border-b border-zinc-200 dark:border-zinc-800 min-h-[60px] sm:min-h-[90px] p-1 sm:p-1.5 text-left flex flex-col transition-colors ${isSelected
                                        ? "bg-indigo-50 dark:bg-indigo-500/10"
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                        }`}
                                >
                                    <span className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${isToday
                                        ? "bg-indigo-600 text-white"
                                        : "text-zinc-700 dark:text-zinc-300"
                                        }`}>
                                        {day}
                                    </span>

                                    {/* Inline tasks — desktop: text, mobile: dots */}
                                    <div className="mt-0.5 space-y-0.5 overflow-hidden flex-1">
                                        {/* Desktop: show task text */}
                                        {dayTasks.slice(0, 3).map(t => (
                                            <div
                                                key={t.id}
                                                className={`hidden sm:block text-[10px] leading-tight truncate px-1.5 py-0.5 rounded border-l-2 ${PRIORITY_BORDER[t.priority]} ${t.completed
                                                    ? "text-zinc-400 line-through bg-zinc-100 dark:bg-zinc-800"
                                                    : "text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900"
                                                    }`}
                                            >
                                                {t.text}
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <span className="hidden sm:block text-[9px] text-zinc-400 pl-1.5">+{dayTasks.length - 3} ещё</span>
                                        )}

                                        {/* Mobile: colored dots */}
                                        {dayTasks.length > 0 && (
                                            <div className="flex sm:hidden gap-0.5 mt-1">
                                                {dayTasks.slice(0, 4).map((t, j) => (
                                                    <div key={j} className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[t.priority]}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── WEEK / AGENDA VIEW ─── */}
            {viewMode === "week" && (
                <div className="space-y-2">
                    {weekDays.map(wd => {
                        const dayTasks = tasksByDate[wd.dateStr] || [];
                        const isSelected = wd.dateStr === selectedDate;

                        return (
                            <button
                                key={wd.dateStr}
                                onClick={() => setSelectedDate(wd.dateStr)}
                                className={`w-full text-left p-3 sm:p-4 rounded-2xl border transition-all ${isSelected
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${wd.isToday
                                        ? "bg-indigo-600 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                        }`}>
                                        <span className="text-[9px] font-bold uppercase leading-none">{wd.dayName}</span>
                                        <span className="text-sm sm:text-lg font-black leading-none">{wd.day}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {dayTasks.length === 0 ? (
                                            <span className="text-sm text-zinc-400 italic">Нет задач</span>
                                        ) : (
                                            <div className="space-y-1">
                                                {dayTasks.map(t => (
                                                    <div key={t.id} className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`} />
                                                        <span className={`text-sm truncate ${t.completed ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                                                            {t.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">{dayTasks.length}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ─── SELECTED DAY DETAIL PANEL ─── */}
            <AnimatePresence mode="wait">
                {selectedDate && (
                    <motion.div
                        key={selectedDate}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4"
                    >
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            📅
                            <span className="capitalize">
                                {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru", {
                                    weekday: "long", day: "numeric", month: "long"
                                })}
                            </span>
                            <span className="ml-auto text-xs font-semibold text-zinc-400">{selectedTasks.length} задач</span>
                        </h4>

                        {selectedTasks.length === 0 ? (
                            <p className="text-sm text-zinc-400 py-4 text-center">Нет задач на этот день</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedTasks.map(t => (
                                    <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-xl border-l-2 ${PRIORITY_BORDER[t.priority]} bg-zinc-50 dark:bg-zinc-950 group`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${t.completed
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "border-zinc-300 dark:border-zinc-700 hover:border-emerald-500"
                                                }`}
                                        >
                                            {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </button>
                                        <span className={`flex-1 text-sm truncate ${t.completed ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                                            {t.text}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                                            className="p-1 text-zinc-400 hover:text-rose-500 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick add */}
                        <form onSubmit={handleAddTask} className="flex gap-2">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                placeholder="Новая задача на этот день..."
                                className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
