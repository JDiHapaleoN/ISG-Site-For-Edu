"use client";

import { Activity, LayoutDashboard } from "lucide-react";

export default function Loading() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col pt-12">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-pulse">
                {/* Welcome Banner Skeleton */}
                <div className="bg-zinc-200 dark:bg-zinc-800/80 rounded-[3rem] p-10 md:p-14 w-full h-[280px]">
                    <div className="max-w-2xl">
                        <div className="h-6 w-32 bg-zinc-300 dark:bg-zinc-700 rounded-full mb-6"></div>
                        <div className="h-12 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded-2xl mb-4"></div>
                        <div className="h-6 w-1/2 bg-zinc-300 dark:bg-zinc-700 rounded-full mb-10"></div>

                        <div className="flex gap-4">
                            <div className="h-12 w-32 bg-zinc-300 dark:bg-zinc-700 rounded-2xl"></div>
                            <div className="h-12 w-32 bg-zinc-300 dark:bg-zinc-700 rounded-2xl"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Modules Header Skeleton */}
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                        </div>

                        {/* Subject Cards Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/50 dark:bg-zinc-900/50 h-[280px] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 mb-6"></div>
                                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-3"></div>
                                    <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-auto"></div>

                                    <div className="space-y-3 mt-6">
                                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        <div className="flex justify-between">
                                            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                            <div className="h-3 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Heatmap Skeleton */}
                        <div className="bg-white/50 dark:bg-zinc-900/50 h-[260px] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col">
                            <div className="flex gap-4 items-center mb-8">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                                <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                            </div>
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50"></div>
                        </div>
                    </div>

                    {/* Right Column (Timer) */}
                    <div className="space-y-8">
                        <div className="bg-white/50 dark:bg-zinc-900/50 h-[400px] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                                <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                                <div className="w-48 h-48 rounded-full bg-zinc-200 dark:bg-zinc-800 border-8 border-zinc-100 dark:border-zinc-900 border-t-zinc-300 dark:border-t-zinc-700"></div>
                                <div className="h-14 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                            </div>
                        </div>

                        {/* Weekly Goals Skeleton */}
                        <div className="bg-white/50 dark:bg-zinc-900/50 h-[200px] rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col gap-6">
                            <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                            <div className="space-y-4">
                                <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                                <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
