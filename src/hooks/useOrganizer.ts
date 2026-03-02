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

    // Match time patterns like "в 10", "в 10:30", "at 10", "at 10:30"
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

    // Check for "tomorrow" / "завтра"
    for (const word of TOMORROW_WORDS) {
        if (text.toLowerCase().includes(word)) {
            deadline = new Date();
            deadline.setDate(deadline.getDate() + 1);
            text = text.replace(new RegExp(word, "gi"), "").trim();
            break;
        }
    }

    // Check for "today" / "сегодня"
    if (!deadline) {
        for (const word of TODAY_WORDS) {
            if (text.toLowerCase().includes(word)) {
                deadline = new Date();
                text = text.replace(new RegExp(word, "gi"), "").trim();
                break;
            }
        }
    }

    // If time was found but no date keyword, assume today
    if (hasTime && !deadline) {
        deadline = new Date();
    }

    if (deadline && hasTime) {
        deadline.setHours(hours, minutes, 0, 0);
    } else if (deadline) {
        deadline.setHours(23, 59, 0, 0);
    }

    // Clean up extra spaces
    text = text.replace(/\s{2,}/g, " ").trim();

    return {
        text,
        deadline: deadline ? deadline.toISOString() : null,
    };
}

// ── Hook ───────────────────────────────────────────────────────────

const TASKS_KEY = "organizer-tasks";
const HABITS_KEY = "organizer-habits";
const POMODORO_KEY = "organizer-pomodoro";

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export function useOrganizer() {
    const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(TASKS_KEY, []));
    const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage(HABITS_KEY, []));
    const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats>(() =>
        loadFromStorage(POMODORO_KEY, { completedToday: 0, lastDate: new Date().toISOString().slice(0, 10) })
    );

    // Persist tasks
    useEffect(() => {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }, [tasks]);

    // Persist habits
    useEffect(() => {
        localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    }, [habits]);

    // Persist pomodoro
    useEffect(() => {
        localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoroStats));
    }, [pomodoroStats]);

    // ── Task Operations ──

    const addTask = useCallback((text: string, priority: Priority = "medium", deadline: string | null = null) => {
        const parsed = parseSmartText(text);
        const newTask: Task = {
            id: crypto.randomUUID(),
            text: parsed.text,
            completed: false,
            priority,
            deadline: deadline || parsed.deadline,
            createdAt: new Date().toISOString(),
        };
        setTasks(prev => [newTask, ...prev]);
    }, []);

    const toggleTask = useCallback((id: string) => {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    }, []);

    const deleteTask = useCallback((id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateTaskPriority = useCallback((id: string, priority: Priority) => {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, priority } : t)));
    }, []);

    const updateTaskDeadline = useCallback((id: string, deadline: string | null) => {
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, deadline } : t)));
    }, []);

    // ── Habit Operations ──

    const addHabit = useCallback((name: string) => {
        const newHabit: Habit = {
            id: crypto.randomUUID(),
            name,
            completedDates: [],
            createdAt: new Date().toISOString(),
        };
        setHabits(prev => [...prev, newHabit]);
    }, []);

    const toggleHabitToday = useCallback((id: string) => {
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
    }, []);

    const deleteHabit = useCallback((id: string) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    }, []);

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
                break; // gap found
            }
            // allow skipping today if not yet completed
        }
        return streak;
    }, []);

    // ── Pomodoro Operations ──

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
