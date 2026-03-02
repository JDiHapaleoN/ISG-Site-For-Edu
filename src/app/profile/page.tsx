import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookOpen, Clock, Target, Zap, Waves, Award } from "lucide-react";
import Link from "next/link";
import ContributionHeatmap from "@/components/dashboard/ContributionHeatmap";
import ProfileCustomizer from "@/components/profile/ProfileCustomizer";
import { getProfileStats } from "@/app/actions/profileActions";
import { getDashboardData } from "@/app/actions/getDashboardData";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
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

    if (!dbUser) {
        redirect("/login");
    }

    const stats = await getProfileStats();
    const dashboardData = await getDashboardData(); // For streak

    const bannerColor = dbUser.bannerColor || "#6366f1";

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 pb-24">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Profile Header */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-all duration-500">
                    <div
                        className="absolute top-0 right-0 w-[400px] h-[400px] blur-[100px] pointer-events-none opacity-20"
                        style={{ backgroundColor: bannerColor }}
                    />

                    <div
                        className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-bold shadow-2xl transition-transform duration-500 hover:scale-105 overflow-hidden"
                        style={{ backgroundColor: bannerColor }}
                    >
                        {dbUser.avatarUrl?.startsWith('http') ? (
                            <img src={dbUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            dbUser.avatarUrl || dbUser.email?.[0].toUpperCase()
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-5xl font-black font-sans mb-2 tracking-tight">
                            {dbUser.name || "Исследователь"}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-4 text-lg">{dbUser.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-700/50">
                                Уровень {Math.floor(stats.totalHours / 2) + 1}
                            </span>
                            <span
                                className="px-5 py-2 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                                style={{ backgroundColor: bannerColor }}
                            >
                                Профиль активен
                            </span>
                        </div>
                    </div>

                    <ProfileCustomizer user={{
                        id: dbUser.id,
                        name: dbUser.name,
                        avatarUrl: dbUser.avatarUrl,
                        bannerColor: dbUser.bannerColor,
                        email: dbUser.email
                    }} />
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <Clock className="w-8 h-8 text-indigo-500 mb-4" />
                        <span className="text-3xl font-black block">{stats.totalHours}ч</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Часов в фокусе</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <Zap className="w-8 h-8 text-orange-500 mb-4" />
                        <span className="text-3xl font-black block">{dashboardData.streak}</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Дней подряд</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <BookOpen className="w-8 h-8 text-emerald-500 mb-4" />
                        <span className="text-3xl font-black block">{stats.totalWords}</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Выученных слов</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <Award className="w-8 h-8 text-rose-500 mb-4" />
                        <span className="text-3xl font-black block">{stats.totalSessions}</span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Завершенных сессий</span>
                    </div>
                </div>

                {/* Heatmap Section */}
                <ContributionHeatmap />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                    {/* Saved Texts */}
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-3xl font-black flex items-center gap-4">
                            <BookOpen className="w-8 h-8 text-indigo-500" />
                            Сохраненные тексты ({dbUser.savedTexts.length})
                        </h2>

                        {dbUser.savedTexts.length === 0 ? (
                            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-16 text-center">
                                <p className="text-zinc-500 text-lg font-medium">У вас пока нет сохраненных текстов.</p>
                                <Link href="/reader" className="text-indigo-500 font-bold hover:underline mt-4 inline-block text-xl">
                                    Открыть Ридер
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {dbUser.savedTexts.map((text) => (
                                    <div
                                        key={text.id}
                                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] hover:border-indigo-500 transition-all group shadow-sm hover:shadow-2xl hover:-translate-y-1"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block">
                                            {text.module === 'german' ? 'Немецкий' : 'Английский'}
                                        </span>
                                        <h3 className="font-bold text-xl mb-3 line-clamp-1 group-hover:text-indigo-500 transition-colors">
                                            {text.title}
                                        </h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-3 mb-6 leading-relaxed">
                                            {text.content}
                                        </p>
                                        <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                            <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {new Date(text.createdAt).toLocaleDateString()}
                                            </span>
                                            <Link
                                                href={`/reader?module=${text.module}`}
                                                className="text-xs font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-tighter"
                                            >
                                                Изучать сейчас →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-8">
                        <h2 className="text-3xl font-black flex items-center gap-4">
                            <Target className="w-8 h-8 text-indigo-500" />
                            Активность
                        </h2>
                        <div className="space-y-4">
                            {dbUser.practiceLogs.length === 0 ? (
                                <p className="text-zinc-500 text-center py-8">История пуста</p>
                            ) : (
                                dbUser.practiceLogs.map((log) => (
                                    <div key={log.id} className="flex gap-5 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            < Zap className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold truncate">{log.topic}</p>
                                            <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                                                <span className="text-zinc-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                {log.score && (
                                                    <span className="text-emerald-500 font-bold">Балл: {log.score}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
