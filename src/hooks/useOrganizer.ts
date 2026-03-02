"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low";

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
    deadline: string | null; // ISO date string
    createdAt: string;
}

export interface Habit {
    id: string;
    name: string;
    completedDates: string[]; // array of ISO date strings (YYYY-MM-DD)
    createdAt: string;
}

export interface PomodoroStats {
    completedToday: number;
    lastDate: string; // YYYY-MM-DD
}

// ── Smart Text Parser ──────────────────────────────────────────────

const TOMORROW_WORDS = ["завтра", "tomorrow"];
const TODAY_WORDS = ["сегодня", "today"];

export function parseSmartText(input: string): { text: string; deadline: string | null } {
    let text = input.trim();
    let deadline: Date | null = null;

    const timeRegex = /(?:в|at)\s+(\d{1,2})(?::(\d{2}))?\b/i;
    const timeMatch = text.match(timeRegex);

    let hours = 0;
    let minutes = 0;
    let hasTime = false;

    if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        hasTime = true;
        text = text.replace(timeMatch[0], "").trim();
    }

    for (const word of TOMORROW_WORDS) {
        if (text.toLowerCase().includes(word)) {
            deadline = new Date();
            deadline.setDate(deadline.getDate() + 1);
            text = text.replace(new RegExp(word, "gi"), "").trim();
            break;
        }
    }

    if (!deadline) {
        for (const word of TODAY_WORDS) {
            if (text.toLowerCase().includes(word)) {
                deadline = new Date();
                text = text.replace(new RegExp(word, "gi"), "").trim();
                break;
            }
        }
    }

    if (hasTime && !deadline) {
        deadline = new Date();
    }

    if (deadline && hasTime) {
        deadline.setHours(hours, minutes, 0, 0);
    } else if (deadline) {
        deadline.setHours(23, 59, 0, 0);
    }

    text = text.replace(/\s{2,}/g, " ").trim();

    return {
        text,
        deadline: deadline ? deadline.toISOString() : null,
    };
}

// ── Hook ───────────────────────────────────────────────────────────

const POMODORO_KEY = "organizer-pomodoro";

function loadPomodoro(): PomodoroStats {
    if (typeof window === "undefined") return { completedToday: 0, lastDate: new Date().toISOString().slice(0, 10) };
    try {
        const raw = localStorage.getItem(POMODORO_KEY);
        return raw ? JSON.parse(raw) : { completedToday: 0, lastDate: new Date().toISOString().slice(0, 10) };
    } catch {
        return { completedToday: 0, lastDate: new Date().toISOString().slice(0, 10) };
    }
}

export function useOrganizer() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats>(loadPomodoro);

    // ── Load from API on mount ──
    useEffect(() => {
        const loadData = async () => {
            try {
                const [tasksRes, habitsRes] = await Promise.all([
                    fetch("/api/organizer/tasks"),
                    fetch("/api/organizer/habits"),
                ]);
                if (tasksRes.ok) {
                    const data = await tasksRes.json();
                    setTasks(data.map((t: any) => ({ ...t, deadline: t.deadline || null })));
                }
                if (habitsRes.ok) {
                    const data = await habitsRes.json();
                    setHabits(data);
                }
            } catch (e) {
                console.error("Failed to load organizer data", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Persist pomodoro in localStorage (session data)
    useEffect(() => {
        localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoroStats));
    }, [pomodoroStats]);

    // ── Task Operations (Optimistic UI + API) ──

    const addTask = useCallback(async (text: string, priority: Priority = "medium", deadline: string | null = null) => {
        const parsed = parseSmartText(text);
        const tempId = crypto.randomUUID();
        const finalDeadline = deadline || parsed.deadline;

        // Optimistic
        const optimistic: Task = {
            id: tempId,
            text: parsed.text,
            completed: false,
            priority,
            deadline: finalDeadline,
            createdAt: new Date().toISOString(),
        };
        setTasks(prev => [optimistic, ...prev]);

        try {
            const res = await fetch("/api/organizer/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: parsed.text, priority, deadline: finalDeadline }),
            });
            if (res.ok) {
                const saved = await res.json();
                setTasks(prev => prev.map(t => t.id === tempId ? { ...saved, deadline: saved.deadline || null } : t));
            }
        } catch (e) {
            console.error("Failed to save task", e);
        }
    }, []);

    const toggleTask = useCallback(async (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        try {
            await fetch("/api/organizer/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, completed: !task.completed }),
            });
        } catch (e) {
            console.error("Failed to toggle task", e);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t));
        }
    }, [tasks]);

    const deleteTask = useCallback(async (id: string) => {
        const backup = tasks;
        setTasks(prev => prev.filter(t => t.id !== id));

        try {
            await fetch("/api/organizer/tasks", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (e) {
            console.error("Failed to delete task", e);
            setTasks(backup);
        }
    }, [tasks]);

    const updateTaskPriority = useCallback(async (id: string, priority: Priority) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));

        try {
            await fetch("/api/organizer/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, priority }),
            });
        } catch (e) {
            console.error("Failed to update priority", e);
        }
    }, []);

    const updateTaskDeadline = useCallback(async (id: string, deadline: string | null) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, deadline } : t));

        try {
            await fetch("/api/organizer/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, deadline }),
            });
        } catch (e) {
            console.error("Failed to update deadline", e);
        }
    }, []);

    // ── Habit Operations (Optimistic UI + API) ──

    const addHabit = useCallback(async (name: string) => {
        const tempId = crypto.randomUUID();
        const optimistic: Habit = {
            id: tempId,
            name,
            completedDates: [],
            createdAt: new Date().toISOString(),
        };
        setHabits(prev => [...prev, optimistic]);

        try {
            const res = await fetch("/api/organizer/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const saved = await res.json();
                setHabits(prev => prev.map(h => h.id === tempId ? saved : h));
            }
        } catch (e) {
            console.error("Failed to save habit", e);
        }
    }, []);

    const toggleHabitToday = useCallback(async (id: string) => {
        const today = new Date().toISOString().slice(0, 10);

        setHabits(prev =>
            prev.map(h => {
                if (h.id !== id) return h;
                const dates = h.completedDates.includes(today)
                    ? h.completedDates.filter(d => d !== today)
                    : [...h.completedDates, today];
                return { ...h, completedDates: dates };
            })
        );

        try {
            await fetch("/api/organizer/habits", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, date: today }),
            });
        } catch (e) {
            console.error("Failed to toggle habit", e);
        }
    }, []);

    const deleteHabit = useCallback(async (id: string) => {
        const backup = habits;
        setHabits(prev => prev.filter(h => h.id !== id));

        try {
            await fetch("/api/organizer/habits", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (e) {
            console.error("Failed to delete habit", e);
            setHabits(backup);
        }
    }, [habits]);

    const getStreak = useCallback((habit: Habit): number => {
        const sorted = [...habit.completedDates].sort().reverse();
        if (sorted.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().slice(0, 10);
            if (sorted.includes(dateStr)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }, []);

    // ── Pomodoro Operations (localStorage only) ──

    const addPomodoroSession = useCallback(() => {
        const today = new Date().toISOString().slice(0, 10);
        setPomodoroStats(prev => {
            if (prev.lastDate !== today) {
                return { completedToday: 1, lastDate: today };
            }
            return { ...prev, completedToday: prev.completedToday + 1 };
        });
    }, []);

    return {
        tasks,
        habits,
        isLoading,
        pomodoroStats,
        addTask,
        toggleTask,
        deleteTask,
        updateTaskPriority,
        updateTaskDeadline,
        addHabit,
        toggleHabitToday,
        deleteHabit,
        getStreak,
        addPomodoroSession,
    };
}
