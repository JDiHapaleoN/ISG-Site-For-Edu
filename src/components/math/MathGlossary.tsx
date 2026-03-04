"use client";

import { useState, useEffect } from "react";
import { Search, LibraryBig } from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { getGlossaryItems } from "@/app/actions/glossaryActions";

export default function MathGlossary() {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getGlossaryItems().then(data => {
            setItems(data);
            setIsLoading(false);
        }).catch(console.error);
    }, []);

    const filteredItems = items.filter(
        (item) =>
            item.termRu.toLowerCase().includes(search.toLowerCase()) ||
            item.termEn.toLowerCase().includes(search.toLowerCase()) ||
            item.termDe.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
            {/* Search Header */}
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl w-full">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mb-6">
                    <LibraryBig className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-indigo-500" />
                    <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 leading-tight">
                        Трехъязычный математический глоссарий
                    </h2>
                </div>
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Поиск пределов, производных, интегралов (RU / EN / DE)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                    />
                </div>
            </div>

            {/* Glossary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all flex flex-col gap-4 group"
                    >
                        <div className="flex flex-col gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                {item.termRu}
                            </h3>
                            <div className="flex gap-4 text-sm font-medium">
                                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                    🇬🇧 {item.termEn}
                                </span>
                                <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1">
                                    🇩🇪 {item.termDe}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[40px]">
                            {item.definitionRu}
                        </p>

                        <div className="mt-auto bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl flex items-center justify-center min-h-[100px] border border-zinc-100 dark:border-zinc-800/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 transition-colors">
                            <MathRenderer math={item.formula} block className="text-lg md:text-xl text-zinc-800 dark:text-zinc-200" />
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-20 text-center text-zinc-500 font-medium bg-white/50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl">
                        Математические термины не найдены.
                    </div>
                )}
            </div>
        </div>
    );
}
