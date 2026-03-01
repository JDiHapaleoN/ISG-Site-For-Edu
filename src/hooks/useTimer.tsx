"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TrackerState>("idle");
    const [subject, setSubject] = useState<Subject>("english");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [completedSessions, setCompletedSessions] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (state !== "idle" && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (state === "studying") {
                setCompletedSessions((prev) => prev + 1);
                setState("resting");
                setTimeLeft(5 * 60);

                // SAVE SESSION TO DB
                // Since this is a hook from a client component, we import the server action dynamically
                import("@/app/actions/saveFocusSession").then(({ saveFocusSession }) => {
                    saveFocusSession(subject, 25 * 60).catch(console.error);
                }).catch(console.error);

            } else if (state === "resting") {
                setState("idle");
                setTimeLeft(25 * 60);
            }
        }

        return () => clearInterval(interval);
    }, [state, timeLeft, subject]);

    const toggleTimer = () => {
        if (state === "idle") {
            setState("studying");
        } else if (state === "studying") {
            setState("idle");
        } else {
            setState("idle");
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
