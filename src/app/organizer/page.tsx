"use client";

import { useState } from "react";
import { ListTodo, CalendarDays, Timer, Sparkles, LayoutGrid } from "lucide-react";
import { useOrganizer } from "@/hooks/useOrganizer";
import TaskManager from "@/components/organizer/TaskManager";
import CalendarView from "@/components/organizer/CalendarView";
import PomodoroTimer from "@/components/organizer/PomodoroTimer";
import HabitTracker from "@/components/organizer/HabitTracker";
import EisenhowerMatrix from "@/components/organizer/EisenhowerMatrix";

type Tab = "tasks" | "calendar" | "pomodoro" | "habits" | "matrix";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "tasks", label: "Задачи", icon: <ListTodo className="w-4 h-4" /> },
    { key: "calendar", label: "Календарь", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "pomodoro", label: "Помодоро", icon: <Timer className="w-4 h-4" /> },
    { key: "habits", label: "Привычки", icon: <Sparkles className="w-4 h-4" /> },
    { key: "matrix", label: "Матрица", icon: <LayoutGrid className="w-4 h-4" /> },
];

export default function OrganizerPage() {
    const [activeTab, setActiveTab] = useState<Tab>("tasks");
    const organizer = useOrganizer();

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                        🗂️ Органайзер
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm md:text-base">
                        Управляйте задачами, планируйте в календаре, тренируйте фокус и отслеживайте привычки.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-900 rounded-2xl overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                                ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 md:p-6 shadow-2xl min-h-[400px]">
                    {organizer.isLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                            <div className="flex gap-2">
                                <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                                <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                            </div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {activeTab === "tasks" && (
                                <TaskManager
                                    tasks={organizer.tasks}
                                    addTask={organizer.addTask}
                                    toggleTask={organizer.toggleTask}
                                    deleteTask={organizer.deleteTask}
                                    updateTaskPriority={organizer.updateTaskPriority}
                                    updateTaskDeadline={organizer.updateTaskDeadline}
                                />
                            )}
                            {activeTab === "calendar" && (
                                <CalendarView
                                    tasks={organizer.tasks}
                                    addTask={organizer.addTask}
                                    toggleTask={organizer.toggleTask}
                                    deleteTask={organizer.deleteTask}
                                />
                            )}
                            {activeTab === "pomodoro" && (
                                <PomodoroTimer
                                    completedToday={organizer.pomodoroStats.completedToday}
                                    addPomodoroSession={organizer.addPomodoroSession}
                                />
                            )}
                            {activeTab === "habits" && (
                                <HabitTracker
                                    habits={organizer.habits}
                                    addHabit={organizer.addHabit}
                                    toggleHabitToday={organizer.toggleHabitToday}
                                    deleteHabit={organizer.deleteHabit}
                                    getStreak={organizer.getStreak}
                                />
                            )}
                            {activeTab === "matrix" && (
                                <EisenhowerMatrix
                                    tasks={organizer.tasks}
                                    toggleTask={organizer.toggleTask}
                                    deleteTask={organizer.deleteTask}
                                    updateTaskPriority={organizer.updateTaskPriority}
                                    updateTaskDeadline={organizer.updateTaskDeadline}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
