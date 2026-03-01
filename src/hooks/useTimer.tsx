"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type TrackerState = "idle" | "studying" | "paused" | "resting";
export type Subject = "english" | "german" | "math";

interface TimerContextProps {
    state: TrackerState;
    subject: Subject;
    timeLeft: number;
    initialTime: number;
    completedSessions: number;
    setSubject: (subject: Subject) => void;
    setCustomTime: (minutes: number) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

const STORAGE_KEY = "isg_study_timer_v2";

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TrackerState>("idle");
    const [subject, setSubject] = useState<Subject>("english");
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Ref to avoid per-second localStorage writes
    const lastSaveRef = useRef<number>(Date.now());

    // 1. Initial Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(parsed.state || "idle");
                setSubject(parsed.subject || "english");
                setCompletedSessions(parsed.completedSessions || 0);
                const savedInitial = parsed.initialTime || 25 * 60;
                setInitialTime(savedInitial);

                if (parsed.state === "studying" || parsed.state === "resting") {
                    const elapsed = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
                    const remaining = Math.max(0, (parsed.timeLeft || 0) - elapsed);
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(parsed.timeLeft ?? savedInitial);
                }
            } catch (e) {
                console.error("Error loading timer state:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // 2. Optimized Persistence - Only on significant changes
    const persistTime = (newState: TrackerState, newTimeLeft: number) => {
        if (!isLoaded) return;
        const data = {
            state: newState,
            subject,
            initialTime,
            timeLeft: newTimeLeft,
            completedSessions,
            lastTimestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        lastSaveRef.current = Date.now();
    };

    // 3. Main Timer Loop
    useEffect(() => {
        if (!isLoaded || (state !== "studying" && state !== "resting")) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                const next = Math.max(0, prev - 1);

                // Periodic safety save every 10 seconds, not every second
                if (Date.now() - lastSaveRef.current > 10000) {
                    persistTime(state, next);
                }

                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state, isLoaded, subject, initialTime]);

    // 4. Handle Phase Completion
    useEffect(() => {
        if (isLoaded && (state === "studying" || state === "resting") && timeLeft === 0) {
            if (state === "studying") {
                const nextState = "resting";
                const nextTime = 5 * 60;
                setCompletedSessions((prev) => prev + 1);
                setState(nextState);
                setTimeLeft(nextTime);
                persistTime(nextState, nextTime);

                // SAVE SESSION TO DB
                import("@/app/actions/saveFocusSession").then(({ saveFocusSession }) => {
                    saveFocusSession(subject, initialTime).catch(console.error);
                }).catch(console.error);
            } else {
                setState("idle");
                setTimeLeft(initialTime);
                persistTime("idle", initialTime);
            }
        }
    }, [timeLeft, state, isLoaded, subject, initialTime]);

    const setCustomTime = (minutes: number) => {
        const seconds = minutes * 60;
        setInitialTime(seconds);
        setTimeLeft(seconds);
        persistTime(state, seconds);
    };

    const toggleTimer = () => {
        let newState: TrackerState = state;
        let newTime = timeLeft;

        if (state === "idle" || state === "paused") {
            newState = "studying";
        } else if (state === "studying" || state === "resting") {
            newState = "paused";
        }

        setState(newState);
        persistTime(newState, newTime);
    };

    const resetTimer = () => {
        setState("idle");
        setTimeLeft(initialTime);
        persistTime("idle", initialTime);
    };

    return (
        <TimerContext.Provider
            value={{
                state,
                subject,
                timeLeft,
                initialTime,
                completedSessions,
                setSubject,
                setCustomTime,
                toggleTimer,
                resetTimer,
            }}
        >
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
}
