"use client";

import { Activity, BookOpen, Clock, Target, Waves, Zap, Award } from "lucide-react";

export default function ProfileLoading() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 pb-24">
            <div className="max-w-6xl mx-auto space-y-12 animate-pulse">

                {/* Profile Header Skeleton */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>

                    <div className="flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start">
                        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-3"></div>
                        <div className="h-5 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6"></div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                            <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-6"></div>
                            <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-3"></div>
                            <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                        </div>
                    ))}
                </div>

                {/* Heatmap Section Skeleton */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 h-[240px] w-full"></div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                    {/* Saved Texts Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] h-[220px]">
                                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4"></div>
                                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-4"></div>
                                    <div className="space-y-2 mb-6">
                                        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Skeleton */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                            <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-5 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
                                    <div className="flex-1 w-full space-y-3 pt-1">
                                        <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        <div className="flex gap-3">
                                            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
