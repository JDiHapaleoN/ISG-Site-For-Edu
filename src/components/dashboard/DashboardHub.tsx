"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Flag, Flame, Target } from "lucide-react";
import PomodoroTimer from "./PomodoroTimer";
import ContributionHeatmap from "./ContributionHeatmap";
import { getDashboardData } from "@/app/actions/getDashboardData";

interface DashboardData {
    readiness: { ielts: number, testdaf: number, math: number };
    streak: number;
    wordsToReview: number;
    quests: { pomodoro: boolean, srs: boolean, essay: boolean };
}

export default function DashboardHub() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        getDashboardData().then(setData).catch(console.error);
    }, []);

    const streak = data?.streak || 0;
    const words = data?.wordsToReview || 0;

    // Readiness ranges 0-100
    const ielts = Math.min(data?.readiness.ielts || 0, 100);
    const testdaf = Math.min(data?.readiness.testdaf || 0, 100);
    const math = Math.min(data?.readiness.math || 0, 100);

    const quests = data?.quests || { pomodoro: false, srs: false, essay: false };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-8 px-4 md:px-0">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-white rounded-3xl p-6 md:p-8 shadow-xl w-full flex flex-col md:flex-row gap-6 justify-between items-center text-white dark:text-zinc-900 overflow-hidden relative">
                <div className="absolute -right-20 -top-20 opacity-10 hidden sm:block">
                    <Flame className="w-96 h-96" />
                </div>
                <div className="relative z-10 flex flex-col gap-2 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                        С возвращением <Flame className="w-8 h-8 text-orange-500" />
                    </h2>
                    <p className="opacity-80 font-medium max-w-lg leading-relaxed text-sm md:text-base">
                        {streak > 0
                            ? `У вас ${streak} дней ударного режима! Продолжайте в том же духе. `
                            : "Начните свой ударный режим прямо сейчас! "}
                        Завершите сегодняшние сессии Pomodoro и повторите карточки SRS.
                    </p>
                </div>
                <div className="relative z-10 flex gap-3 md:gap-4 shrink-0 w-full md:w-auto">
                    <div className="bg-white/10 dark:bg-black/5 p-3 md:p-4 rounded-2xl flex flex-col items-center flex-1 md:flex-none">
                        <span className="text-2xl md:text-3xl font-black">{streak}</span>
                        <span className="text-[10px] md:text-xs uppercase font-bold opacity-70 tracking-widest text-center">Дней<br />Подряд</span>
                    </div>
                    <div className="bg-white/10 dark:bg-black/5 p-3 md:p-4 rounded-2xl flex flex-col items-center flex-1 md:flex-none">
                        <span className={`text-2xl md:text-3xl font-black ${words > 0 ? "text-emerald-400 dark:text-emerald-500" : ""}`}>
                            {words}
                        </span>
                        <span className="text-[10px] md:text-xs uppercase font-bold opacity-70 tracking-widest text-center">Слов для<br />повторения</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Focus Tracker & Heatmap */}
                <div className="lg:col-span-2 flex flex-col gap-8">

                    <ContributionHeatmap />

                    {/* Exam Progress Bars */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-indigo-500" />
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Цели по экзаменам</h3>
                        </div>

                        <div className="flex flex-col gap-5">
                            {/* IELTS */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-indigo-600 dark:text-indigo-400">IELTS Academic (Band 7.5)</span>
                                    <span className="text-zinc-500">Готовность {ielts}%</span>
                                </div>
                                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${ielts}%` }} />
                                </div>
                            </div>

                            {/* Goethe-Zertifikat */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-pink-600 dark:text-pink-400">Goethe-Zertifikat (B2/C1)</span>
                                    <span className="text-zinc-500">Готовность {testdaf}%</span>
                                </div>
                                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-pink-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${testdaf}%` }} />
                                </div>
                            </div>

                            {/* Studienkolleg Aufnahmeprüfung */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-rose-600 dark:text-rose-400">Математика (Studienkolleg)</span>
                                    <span className="text-zinc-500">Готовность {math}%</span>
                                </div>
                                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${math}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timer & Quick Actions */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <PomodoroTimer />

                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Flag className="w-5 h-5 text-zinc-500" />
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Задачи на день</h3>
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl cursor-pointer hover:shadow-sm transition-all group">
                            <input type="checkbox" checked={quests.pomodoro} readOnly className="w-5 h-5 rounded-md text-emerald-500 border-zinc-300 focus:ring-emerald-500 cursor-pointer" />
                            <span className={`font-medium transition-colors ${quests.pomodoro ? "text-emerald-600 dark:text-emerald-500 line-through" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"}`}>
                                Выполнить 2 сессии Pomodoro
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl cursor-pointer hover:shadow-sm transition-all group">
                            <input type="checkbox" checked={quests.srs} readOnly className="w-5 h-5 rounded-md text-emerald-500 border-zinc-300 focus:ring-emerald-500 cursor-pointer" />
                            <span className={`font-medium transition-colors ${quests.srs ? "text-emerald-600 dark:text-emerald-500 line-through" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"}`}>
                                Повторить слова (SRS)
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl cursor-pointer hover:shadow-sm transition-all group">
                            <input type="checkbox" checked={quests.essay} readOnly className="w-5 h-5 rounded-md text-emerald-500 border-zinc-300 focus:ring-emerald-500 cursor-pointer" />
                            <span className={`font-medium transition-colors ${quests.essay ? "text-emerald-600 dark:text-emerald-500 line-through" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white"}`}>
                                Написать 1 эссе (Тренажер ИИ)
                            </span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
