import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
                <div className="w-32 h-32 bg-indigo-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 rotate-12 hover:rotate-0 transition-all duration-500">
                    <Compass className="w-16 h-16 text-indigo-500" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-8xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
                        Страница не найдена
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                        Кажется, вы сбились с пути. Эта страница была перемещена или никогда не существовала.
                    </p>
                </div>

                <div className="pt-8">
                    <Link href="/dashboard" className="w-full">
                        <button
                            className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1"
                        >
                            <Home className="w-5 h-5" />
                            Вернуться в Дашборд
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
