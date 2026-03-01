import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User, BookOpen, Clock, Heart, Settings, Layout, PenTool } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: {
            savedTexts: {
                orderBy: { createdAt: 'desc' }
            },
            practiceLogs: {
                take: 5,
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Profile Header */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-black font-sans mb-2">{dbUser?.name || "Исследователь"}</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-4">{user.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                                Уровень 1
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                Профиль активен
                            </span>
                        </div>
                    </div>
                    <button className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all">
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Stats & Saved Texts */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                                <BookOpen className="w-6 h-6 text-indigo-500" />
                                Сохраненные тексты ({dbUser?.savedTexts.length || 0})
                            </h2>

                            {dbUser?.savedTexts.length === 0 ? (
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                                    <p className="text-zinc-500">У вас пока нет сохраненных текстов.</p>
                                    <Link href="/reader" className="text-indigo-500 font-bold hover:underline mt-2 inline-block">
                                        Перейти в Ридер
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dbUser?.savedTexts.map((text) => (
                                        <div
                                            key={text.id}
                                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-indigo-500 transition-all group shadow-sm hover:shadow-xl"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block">
                                                {text.module === 'german' ? 'Немецкий' : 'Английский'}
                                            </span>
                                            <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-indigo-500 transition-colors">
                                                {text.title}
                                            </h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                                                {text.content}
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(text.createdAt).toLocaleDateString()}
                                                </span>
                                                <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600 underline">
                                                    Продолжить изучение
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Activity Feed */}
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-indigo-500" />
                                Недавняя активность
                            </h2>
                            <div className="space-y-4">
                                {dbUser?.practiceLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4 p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <PenTool className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold truncate max-w-[180px]">{log.topic}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-zinc-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                {log.score && (
                                                    <span className="text-[10px] font-bold text-emerald-500">Балл: {log.score}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
