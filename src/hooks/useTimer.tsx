"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type TrackerState = "idle" | "studying" | "resting";
export type Subject = "english" | "german" | "math";

interface TimerContextProps {
    state: TrackerState;
    subject: Subject;
    timeLeft: number;
    completedSessions: number;
    setSubject: (subject: Subject) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

const STORAGE_KEY = "isg_study_timer_state";

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TrackerState>("idle");
    const [subject, setSubject] = useState<Subject>("english");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Use a ref to track the last tick time for accurate syncing when tab is inactive
    const lastTickRef = useRef<number>(Date.now());

    // 1. Initial Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(parsed.state || "idle");
                setSubject(parsed.subject || "english");
                setCompletedSessions(parsed.completedSessions || 0);

                // Calculate time left based on the last known timestamp if it was running
                if (parsed.state !== "idle" && parsed.lastTimestamp) {
                    const elapsedSinceLastSave = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
                    const remaining = Math.max(0, (parsed.timeLeft || 0) - elapsedSinceLastSave);
                    setTimeLeft(remaining);

                    // If time ran out while away, the main timer loop (step 3) will handle the transition
                } else {
                    setTimeLeft(parsed.timeLeft ?? 25 * 60);
                }
            } catch (e) {
                console.error("Error loading timer state:", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // 2. Persistent Save to LocalStorage
    useEffect(() => {
        if (!isLoaded) return;

        const data = {
            state,
            subject,
            timeLeft,
            completedSessions,
            lastTimestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [state, subject, timeLeft, completedSessions, isLoaded]);

    // 3. Main Timer Loop with Background Sync
    useEffect(() => {
        if (!isLoaded || state === "idle") return;

        lastTickRef.current = Date.now();

        const interval = setInterval(() => {
            const now = Date.now();
            // Calculate actual deviation to handle background throttling
            const delta = Math.floor((now - lastTickRef.current) / 1000);

            if (delta >= 1) {
                setTimeLeft((prev) => {
                    const next = Math.max(0, prev - delta);
                    lastTickRef.current = now;
                    return next;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [state, isLoaded]);

    // 4. Handle Phase Completion
    useEffect(() => {
        if (isLoaded && state !== "idle" && timeLeft === 0) {
            if (state === "studying") {
                setCompletedSessions((prev) => prev + 1);
                setState("resting");
                setTimeLeft(5 * 60);

                // SAVE SESSION TO DB
                import("@/app/actions/saveFocusSession").then(({ saveFocusSession }) => {
                    saveFocusSession(subject, 25 * 60).catch(console.error);
                }).catch(console.error);

            } else if (state === "resting") {
                setState("idle");
                setTimeLeft(25 * 60);
            }
        }
    }, [timeLeft, state, subject, isLoaded]);

    const toggleTimer = () => {
        if (state === "idle") {
            setState("studying");
            setTimeLeft(25 * 60);
        } else {
            setState("idle");
            setTimeLeft(25 * 60);
        }
    };

    const resetTimer = () => {
        setState("idle");
        setTimeLeft(25 * 60);
    };

    return (
        <TimerContext.Provider
            value={{
                state,
                subject,
                timeLeft,
                completedSessions,
                setSubject,
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
