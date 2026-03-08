"use client";

import { useState, useEffect } from "react";
import { UserPlus, Check, X, Search, Copy, MessageCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface FriendData {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    friendCode: string;
}

interface Friendship {
    id: string;
    status: "pending" | "accepted";
    isSender: boolean;
    createdAt: string;
    friend: FriendData;
    lastMessage?: {
        content: string;
        createdAt: string;
        isMe: boolean;
    } | null;
    unreadCount?: number;
}

export default function FriendsPage() {
    const [friendships, setFriendships] = useState<Friendship[]>([]);
    const [newFriendCode, setNewFriendCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myCode, setMyCode] = useState<string | null>(null);

    useEffect(() => {
        fetchFriends();
        fetchMyProfile();
    }, []);

    const fetchMyProfile = async () => {
        try {
            const res = await fetch("/api/auth/session");
            const userRes = await fetch("/api/user/profile");
            if (userRes.ok) {
                const data = await userRes.json();
                setMyCode(data.friendCode);
            }
        } catch (e) { console.error(e); }
    }

    const fetchFriends = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/friends");
            if (res.ok) {
                const data = await res.json();
                setFriendships(data);
            }
        } catch (error) {
            console.error("Failed to fetch friends:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!myCode) return;
        navigator.clipboard.writeText(myCode);
        toast.success("Ваш код скопирован!");
    };

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendCode.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendCode: newFriendCode }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Заявка отправлена!");
                setNewFriendCode("");
                fetchFriends(); // Refresh
            } else {
                toast.error(data.error || "Ошибка при добавлении");
            }
        } catch (error) {
            toast.error("Сетевая ошибка");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestAction = async (friendshipId: string, action: "accept" | "reject") => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/friends/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action }),
            });

            if (res.ok) {
                toast.success(action === 'accept' ? "Заявка принята!" : "Заявка отклонена");
                fetchFriends();
            } else {
                const data = await res.json();
                toast.error(data.error || "Ошибка");
            }
        } catch (error) {
            toast.error("Сетевая ошибка");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatLastMessagePreview = (msg: Friendship['lastMessage']) => {
        if (!msg) return null;
        let text = msg.content;
        if (text.startsWith('[VOICE]')) text = '🎤 Голосовое сообщение';
        else if (text.startsWith('[IMAGE]')) text = '📷 Фото';
        else if (text.startsWith('[VIDEO]')) text = '🎬 Видео';
        else if (text.length > 35) text = text.slice(0, 35) + '…';

        return msg.isMe ? `Вы: ${text}` : text;
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / 86400000);

        if (days === 0) return date.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
        if (days === 1) return "Вчера";
        if (days < 7) return date.toLocaleDateString("ru", { weekday: "short" });
        return date.toLocaleDateString("ru", { day: "numeric", month: "short" });
    };

    const pendingRequests = friendships.filter(f => f.status === 'pending' && !f.isSender);
    const sentRequests = friendships.filter(f => f.status === 'pending' && f.isSender);
    const activeFriends = friendships.filter(f => f.status === 'accepted');

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 lg:p-12 pb-24">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header & Your Code */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] p-8 md:p-12 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Друзья</h1>
                        <p className="text-indigo-100 text-lg max-w-md">
                            Добавляйте друзей по их уникальному коду, следите за их прогрессом и общайтесь в чате!
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-[2.5rem] w-full md:w-auto shrink-0 flex flex-col items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-2">Ваш Код Дружбы:</span>
                        <div className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-full border border-white/20">
                            <span className="text-3xl font-black tracking-widest font-mono">
                                {myCode || "------"}
                            </span>
                            <button
                                onClick={handleCopyCode}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                                title="Скопировать"
                            >
                                <Copy className="w-5 h-5 text-white/70 group-hover:text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Friend Input */}
                <form onSubmit={handleAddFriend} className="flex gap-4">
                    <div className="relative flex-1">
                        <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            name="friendCode"
                            placeholder="Введите Код Дружбы (например, A7X9B2)"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-5 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium uppercase font-mono transition-all text-zinc-900 dark:text-zinc-100 shadow-sm"
                            value={newFriendCode}
                            onChange={(e) => setNewFriendCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            disabled={isSubmitting}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || newFriendCode.length < 6}
                        className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white px-8 md:px-12 py-5 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                    >
                        Добавить
                    </button>
                </form>

                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500 animate-pulse font-medium">Загрузка списка друзей...</div>
                ) : (
                    <div className="space-y-12">
                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-black text-indigo-500 uppercase tracking-widest flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    Входящие заявки ({pendingRequests.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
                                                    {req.friend.avatarUrl ? <img src={req.friend.avatarUrl} className="w-full h-full rounded-full object-cover" /> : req.friend.name?.[0] || "?"}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-bold text-lg truncate">{req.friend.name || "Исследователь"}</p>
                                                    <p className="text-xs text-zinc-500 font-mono">Код: {req.friend.friendCode}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={() => handleRequestAction(req.id, "accept")} disabled={isSubmitting} className="w-10 h-10 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-full flex items-center justify-center transition-colors">
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleRequestAction(req.id, "reject")} disabled={isSubmitting} className="w-10 h-10 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full flex items-center justify-center transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Friends - now with chat previews */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-zinc-400 uppercase tracking-widest">
                                Мои Друзья ({activeFriends.length})
                            </h2>
                            {activeFriends.length === 0 ? (
                                <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                                    Пока пусто. Отправьте свой код друзьям или добавьте их!
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {activeFriends.map(f => (
                                        <Link
                                            key={f.id}
                                            href={`/chat/${f.friend.id}`}
                                            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-lg transition-all flex items-center gap-4"
                                        >
                                            {/* Avatar */}
                                            <div className="relative w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                                                {f.friend.avatarUrl ? <img src={f.friend.avatarUrl} className="w-full h-full object-cover" /> : f.friend.name?.[0] || "?"}
                                                {/* Unread badge */}
                                                {(f.unreadCount || 0) > 0 && (
                                                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                        {f.unreadCount! > 9 ? '9+' : f.unreadCount}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name + Preview */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-500 transition-colors">
                                                        {f.friend.name || "Исследователь"}
                                                    </p>
                                                    {f.lastMessage && (
                                                        <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                                                            {formatTime(f.lastMessage.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm truncate mt-0.5 ${(f.unreadCount || 0) > 0 ? 'text-zinc-700 dark:text-zinc-300 font-semibold' : 'text-zinc-500'}`}>
                                                    {f.lastMessage ? formatLastMessagePreview(f.lastMessage) : "Нет сообщений"}
                                                </p>
                                            </div>

                                            {/* Chat icon */}
                                            <MessageCircle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sent Requests */}
                        {sentRequests.length > 0 && (
                            <div className="pt-8 text-center text-sm font-medium text-zinc-500">
                                У вас {sentRequests.length} исходящих заявок в друзья.
                            </div>
                        )}

                    </div>
                )}
            </div>
        </main>
    );
}
