"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global App Error:", error);
    }, [error]);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-12 h-12 text-rose-500" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                        Упс! Что-то пошло не так
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                        В системе произошла непредвиденная ошибка. Мы уже зафиксировали её и скоро всё починим.
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col gap-4">
                    <button
                        onClick={() => reset()}
                        className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-3 transition-colors"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Попробовать снова
                    </button>

                    <Link href="/" className="w-full">
                        <button
                            className="w-full h-14 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-lg flex items-center justify-center gap-3 transition-colors bg-transparent"
                        >
                            <Home className="w-5 h-5" />
                            Вернуться на Главную
                        </button>
                    </Link>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                    Код ошибки: {error.digest || 'UNKNOWN_RUNTIME_EXCEPTION'}
                </p>
            </div>
        </main>
    );
}
