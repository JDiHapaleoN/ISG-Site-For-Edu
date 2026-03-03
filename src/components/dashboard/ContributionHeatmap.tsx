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
    const columns: { date: string, level: number, count: number }[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
        columns.push(heatmapData.slice(i, i + 7));
    }

    const getMonthLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', { month: 'short' });
    };

    const DAYS = ["Пн", "", "Ср", "", "Пт", "", "Вс"];

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm w-full min-h-[200px] transition-all hover:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-emerald-500" />
                    <div>
                        <h3 className="text-xl lg:text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none">Активность</h3>
                        <p className="text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-bold uppercase tracking-widest">История занятий по дням</p>
                    </div>
                </div>

                <div className="h-8">
                    {hoveredDay ? (
                        <span className="inline-flex items-center text-xs bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest shadow-inner border border-zinc-200/50 dark:border-zinc-700/50 animate-in fade-in zoom-in-95">
                            {new Date(hoveredDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} &bull; {hoveredDay.count && hoveredDay.count > 0 ? `${hoveredDay.count} сессий` : "Нет активности"}
                        </span>
                    ) : (
                        <span className="inline-flex items-center text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest px-4 py-2">
                            Наведите на день
                        </span>
                    )}
                </div>
            </div>

            {/* Heatmap Area */}
            <div className="flex bg-zinc-50 dark:bg-zinc-950/50 p-4 lg:p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 overflow-x-auto scrollbar-hide relative shadow-inner">

                {/* Y-axis Labels */}
                <div className="flex flex-col gap-1.5 pr-2 sm:pr-4 text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-600 pt-[28px] sticky left-0 bg-zinc-50 dark:bg-[#0c0c0e] z-20 shrink-0 border-r border-zinc-100 dark:border-zinc-800/80 mr-2">
                    {DAYS.map((day, i) => (
                        <span key={i} className="h-4 sm:h-5 leading-4 sm:leading-5 w-4 sm:w-5 text-right whitespace-nowrap">{day}</span>
                    ))}
                </div>

                {/* Heatmap Grid */}
                <div className="flex gap-1.5 flex-1 pb-2 pt-7 shrink-0 relative">
                    {columns.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-400 animate-pulse">
                            Загрузка данных...
                        </div>
                    ) : (
                        columns.map((col, colIndex) => {
                            const showMonth = colIndex === 0 || (colIndex > 0 &&
                                getMonthLabel(col[0].date) !== getMonthLabel(columns[colIndex - 1][0].date));

                            return (
                                <div key={colIndex} className="flex flex-col gap-1.5 relative group">
                                    {showMonth && (
                                        <span className="absolute -top-7 left-0 text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px] sm:max-w-none">
                                            {getMonthLabel(col[0].date)}
                                        </span>
                                    )}
                                    {col.map((day, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            onMouseEnter={() => setHoveredDay(day)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all duration-200 cursor-pointer border border-black/5 dark:border-white/5 hover:scale-150 hover:z-30 hover:shadow-lg rounded-[3px] ${LEVEL_COLORS[day.level as keyof typeof LEVEL_COLORS]}`}
                                        />
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest justify-end">
                <span>Меньше</span>
                <div className="flex gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                    {[0, 1, 2, 3, 4].map(level => (
                        <div key={level} className={`w-3 h-3 rounded-[3px] border border-black/5 dark:border-white/5 ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`} />
                    ))}
                </div>
                <span>Больше</span>
            </div>
        </div>
    );
}
