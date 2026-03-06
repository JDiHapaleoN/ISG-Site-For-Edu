import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Zap, Target, BookOpen } from "lucide-react";

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        redirect("/login");
    }

    const logId = params.id;

    const practiceLog = await prisma.practiceLog.findUnique({
        where: { id: logId }
    });

    if (!practiceLog || practiceLog.userId !== user.id) {
        redirect("/profile");
    }

    let parsedFeedback = null;
    try {
        parsedFeedback = JSON.parse(practiceLog.aiFeedback);
    } catch {
        // Fallback to raw text if not JSON
    }

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 lg:p-12 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Back Link */}
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-500 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Вернуться в профиль
                </Link>

                {/* Main Content Header */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest rounded-full">
                                    {practiceLog.module === "english" ? "Английский" :
                                        practiceLog.module === "german" ? "Немецкий" :
                                            practiceLog.module === "math" ? "Математика" : practiceLog.module}
                                </span>
                                <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {new Date(practiceLog.createdAt).toLocaleString("ru", {
                                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                                    })}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                                {practiceLog.topic}
                            </h1>
                        </div>

                        {practiceLog.score && (
                            <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-3xl min-w-[120px] shrink-0">
                                <span className="text-emerald-500 font-black text-3xl leading-none">{practiceLog.score}</span>
                                <span className="text-emerald-600/70 dark:text-emerald-400/70 text-[10px] font-bold uppercase tracking-widest mt-1">Оценка</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-12">
                        {/* User Input Section */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Ваш ответ
                            </h2>
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 md:p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed font-serif">
                                    {practiceLog.userInput}
                                </p>
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Анализ ИИ
                            </h2>

                            {parsedFeedback ? (
                                <div className="space-y-6">
                                    {/* Handle various JSON structures gracefully depending on module type */}
                                    {parsedFeedback.feedback && (
                                        <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 md:p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10">
                                            <p className="whitespace-pre-wrap text-indigo-900 dark:text-indigo-200 leading-relaxed">
                                                {parsedFeedback.feedback}
                                            </p>
                                        </div>
                                    )}
                                    {parsedFeedback.improvements && Array.isArray(parsedFeedback.improvements) && (
                                        <div className="bg-amber-50 dark:bg-amber-500/5 p-6 md:p-8 rounded-[2rem] border border-amber-100 dark:border-amber-500/10">
                                            <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-4 flex items-center gap-2">
                                                <Target className="w-5 h-5" /> Как улучшить
                                            </h3>
                                            <ul className="space-y-3">
                                                {parsedFeedback.improvements.map((str: string, i: number) => (
                                                    <li key={i} className="text-amber-800 dark:text-amber-300 flex gap-3">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                                                        <span className="leading-relaxed">{str}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Render anything else if unexpected JSON */}
                                    {!parsedFeedback.feedback && !parsedFeedback.improvements && (
                                        <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 md:p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10">
                                            <pre className="whitespace-pre-wrap text-indigo-900 dark:text-indigo-200 text-sm overflow-x-auto">
                                                {JSON.stringify(parsedFeedback, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 md:p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10">
                                    <p className="whitespace-pre-wrap text-indigo-900 dark:text-indigo-200 leading-relaxed">
                                        {practiceLog.aiFeedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
