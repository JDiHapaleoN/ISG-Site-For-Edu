import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Clock, BookOpen, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ensurePrismaUser } from "@/lib/auth-sync";

// Minimal stats calculation helper based strictly on friend's records
async function getFriendStats(friendId: string) {
    const englishSessions = await prisma.englishSession.aggregate({ _sum: { durationMins: true }, where: { userId: friendId } });
    const germanSessions = await prisma.germanSession.aggregate({ _sum: { durationMins: true }, where: { userId: friendId } });
    const mathSessions = await prisma.mathSession.aggregate({ _sum: { durationMins: true }, where: { userId: friendId } });

    const totalHours = Math.round(
        ((englishSessions._sum.durationMins || 0) +
            (germanSessions._sum.durationMins || 0) +
            (mathSessions._sum.durationMins || 0)) / 60
    );

    const engWords = await prisma.englishWord.count({ where: { userId: friendId, srsStep: { gt: 0 } } });
    const gerWords = await prisma.germanWord.count({ where: { userId: friendId, srsStep: { gt: 0 } } });

    return { totalHours, learnedWords: engWords + gerWords };
}

export default async function FriendProfilePage({ params }: { params: { id: string } }) {
    const friendId = params.id;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUser = session?.user;

    if (!supabaseUser) return redirect("/login");

    const currentUser = await ensurePrismaUser(supabaseUser);
    if (!currentUser) return redirect("/login");

    if (friendId === currentUser.id) {
        return redirect("/profile");
    }

    const friend = await prisma.user.findUnique({
        where: { id: friendId },
        select: { id: true, name: true, avatarUrl: true, bannerColor: true, friendCode: true }
    });

    if (!friend) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
                <p className="text-xl text-zinc-500">Пользователь не найден.</p>
            </div>
        );
    }

    // Verify friendship status to see if they are actually friends
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { user1Id: currentUser.id, user2Id: friendId },
                { user1Id: friendId, user2Id: currentUser.id }
            ]
        }
    });

    const isFriend = friendship?.status === "accepted";
    const bannerColor = friend.bannerColor || "#6366f1";
    const stats = await getFriendStats(friendId);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 lg:p-12 pb-24">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <Link href="/friends" className="text-zinc-500 hover:text-indigo-500 font-bold transition-colors">
                        ← Назад к Друзьям
                    </Link>
                </div>

                {/* Profile Header */}
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-16 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div
                        className="absolute top-0 right-0 w-[400px] h-[400px] blur-[100px] pointer-events-none opacity-20"
                        style={{ backgroundColor: bannerColor }}
                    />

                    <div
                        className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black shadow-2xl relative z-10"
                        style={{ backgroundColor: bannerColor }}
                    >
                        {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[2.5rem]" />
                        ) : (
                            friend.name?.[0]?.toUpperCase() || "?"
                        )}
                        {isFriend && (
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white dark:border-zinc-900" title="В друзьях">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-4xl md:text-5xl font-black font-sans mb-3 tracking-tight text-zinc-900 dark:text-zinc-100">
                            {friend.name || "Секретный Агент"}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase mb-6 text-sm">
                            Код Профиля: {friend.friendCode || "Отсутствует"}
                        </p>

                        {!isFriend && friendship?.status === 'pending' && (
                            <span className="inline-block px-5 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm tracking-widest rounded-2xl uppercase border border-amber-200 dark:border-amber-900/50">
                                Заявка отправлена
                            </span>
                        )}
                        {!isFriend && !friendship && (
                            <p className="text-sm text-zinc-500 flex items-center justify-center md:justify-start gap-2">
                                <UserPlus className="w-4 h-4" /> Вы пока не дружите.
                            </p>
                        )}
                        {isFriend && (
                            <Link href={`/chat/${friend.id}`} className="inline-block px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                                Отправить сообщение
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Grid (Only fully visible if friends or open for teaser) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    {!isFriend && (
                        <div className="absolute inset-0 z-20 backdrop-blur-md bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500 font-medium">
                            <ShieldCheck className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-600" />
                            Только для друзей. Добавьте в друзья, чтобы увидеть прогресс.
                        </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Clock className="w-8 h-8 text-indigo-500 mb-4" />
                        <span className="text-4xl font-black block text-zinc-900 dark:text-zinc-100">{stats.totalHours}ч</span>
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-1 block">Часов в фокусе</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <BookOpen className="w-8 h-8 text-emerald-500 mb-4" />
                        <span className="text-4xl font-black block text-zinc-900 dark:text-zinc-100">{stats.learnedWords}</span>
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-1 block">Выученных слов</span>
                    </div>
                </div>

            </div>
        </main>
    );
}
