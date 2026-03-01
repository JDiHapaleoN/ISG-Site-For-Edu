"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { getActivityHeatmapData } from "@/app/actions/getActivityHeatmap";

const LEVEL_COLORS = {
    0: "bg-zinc-100 dark:bg-zinc-800",
    1: "bg-emerald-200 dark:bg-emerald-900",
    2: "bg-emerald-300 dark:bg-emerald-700",
    3: "bg-emerald-400 dark:bg-emerald-500",
    4: "bg-emerald-500 dark:bg-emerald-400"
};

export default function ContributionHeatmap() {
    const [hoveredDay, setHoveredDay] = useState<{ date: string, level: number, count?: number } | null>(null);
    const [heatmapData, setHeatmapData] = useState<{ date: string, level: number, count: number }[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getActivityHeatmapData();
                setHeatmapData(data);
            } catch (err) {
                console.error("Failed to load heatmap data", err);
            }
        }
        loadData();
    }, []);

    // Group into columns of 7 days
    const columns = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
        columns.push(heatmapData.slice(i, i + 7));
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm w-full min-h-[160px]">
            <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-emerald-500" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Активность обучения</h3>

                {hoveredDay && (
                    <span className="ml-auto text-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-300 font-medium animate-fade-in">
                        {hoveredDay.date}: {hoveredDay.count && hoveredDay.count > 0 ? `${hoveredDay.count} сессий` : "Нет активности"}
                    </span>
                )}
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                {columns.map((col, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1">
                        {col.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                onMouseEnter={() => setHoveredDay(day)}
                                onMouseLeave={() => setHoveredDay(null)}
                                className={`w-4 h-4 rounded-sm transition-colors cursor-crosshair ${LEVEL_COLORS[day.level as keyof typeof LEVEL_COLORS]}`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-zinc-400 uppercase tracking-widest justify-end">
                <span>Меньше</span>
                <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(level => (
                        <div key={level} className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`} />
                    ))}
                </div>
                <span>Больше</span>
            </div>
        </div>
    );
}
