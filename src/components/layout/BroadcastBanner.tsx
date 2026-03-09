"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, AlertCircle, X, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Broadcast {
    id: string;
    title: string;
    content: string;
    type: string;
}

export default function BroadcastBanner() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            try {
                const res = await fetch('/api/broadcast');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBroadcasts(data);
                }
            } catch (e) {
                console.error("Failed to fetch broadcasts:", e);
            }
        };
        fetchBroadcasts();
    }, []);

    if (!isVisible || broadcasts.length === 0) return null;

    const current = broadcasts[currentIndex];

    const getColors = (type: string) => {
        switch (type) {
            case 'urgent': return "bg-rose-600 text-white";
            case 'warning': return "bg-amber-500 text-white";
            default: return "bg-indigo-600 text-white";
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'urgent': return <AlertCircle className="w-4 h-4" />;
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`${getColors(current.type)} relative z-[60] overflow-hidden`}
        >
            <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="hidden sm:block">
                            {getIcon(current.type)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 truncate">
                            <span className="font-bold text-sm whitespace-nowrap">{current.title}</span>
                            <span className="text-sm opacity-90 truncate">{current.content}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {broadcasts.length > 1 && (
                            <div className="flex items-center gap-1 mr-2 bg-white/10 rounded-lg px-1">
                                <button
                                    onClick={() => setCurrentIndex((prev) => (prev - 1 + broadcasts.length) % broadcasts.length)}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[10px] font-mono tabular-nums">{currentIndex + 1}/{broadcasts.length}</span>
                                <button
                                    onClick={() => setCurrentIndex((prev) => (prev + 1) % broadcasts.length)}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
