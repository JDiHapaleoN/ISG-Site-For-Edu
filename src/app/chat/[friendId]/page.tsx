"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Fast polling interval (3 seconds) for real-time feel without websockets
const POLL_INTERVAL = 3000;

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
    }
}

const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error("Failed to load");
    return r.json();
});

export default function ChatPage({ params }: { params: { friendId: string } }) {
    const friendId = params.friendId;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // We fetch current user id manually or derive from context. For simplicity, we just assume the senderId != friendId means it's "me".
    const { data: messages, error, mutate } = useSWR<Message[]>(
        `/api/chat?friendId=${friendId}`,
        fetcher,
        { refreshInterval: POLL_INTERVAL }
    );

    // Friend Profile Header (Using a separate SWR or just extract from first message)
    // To be perfectly robust, we fetch friend info to display on the header
    const { data: friendData } = useSWR(`/api/user/profile?id=${friendId}`, fetcher);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            senderId: "me", // Placeholder
            content: newMessage,
            createdAt: new Date().toISOString(),
            sender: { id: "me", name: "I", avatarUrl: null }
        };

        setIsSending(true);
        const previousMessages = messages;

        // Optimistic UI update
        mutate([...(messages || []), optimisticMsg as unknown as Message], false);
        setNewMessage("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendId, content: optimisticMsg.content }),
            });

            if (!res.ok) {
                throw new Error("Failed to send");
            }

            // Revalidate to get real MSG with proper IDs
            mutate();
        } catch (error) {
            toast.error("Сообщение не отправлено");
            mutate(previousMessages, false); // Rollback
            setNewMessage(optimisticMsg.content); // Restore input
        } finally {
            setIsSending(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
                <p className="text-xl text-rose-500 font-bold mb-4">Ошибка доступа</p>
                <Link href="/friends" className="text-zinc-500 hover:text-indigo-500 underline">Вернуться к списку друзей</Link>
            </div>
        );
    }

    return (
        <main className="fixed inset-0 pt-[80px] md:pt-0 pb-[80px] md:pb-0 md:pl-[100px] flex flex-col bg-zinc-50 dark:bg-zinc-950">
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto md:py-6 h-full relative">

                {/* Chat Header */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex items-center justify-between z-10 sticky top-0 md:rounded-t-[2.5rem] shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/friends" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        {friendData || messages?.[0] ? (
                            <Link href={`/profile/${friendId}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-500 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                                    {friendData?.avatarUrl ? <img src={friendData.avatarUrl} className="w-full h-full object-cover" /> : friendData?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">
                                    {friendData?.name || "Друг"}
                                </h1>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="w-24 h-5 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col scroll-smooth md:bg-white md:dark:bg-zinc-900 md:border-x border-zinc-200 dark:border-zinc-800 relative"
                >
                    {!messages && !error && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    )}

                    {messages?.length === 0 && (
                        <div className="m-auto text-center text-zinc-500 dark:text-zinc-400 p-8">
                            <p className="mb-2">Тут пока пусто.</p>
                            <p className="text-sm">Напишите Привет, чтобы начать общение!</p>
                        </div>
                    )}

                    {messages?.map((msg, idx) => {
                        const isMe = msg.senderId !== friendId; // Because I am the only other participant in a DM
                        const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId === friendId);

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full group`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-2 shrink-0 overflow-hidden mt-auto mb-1">
                                        {showAvatar ? (msg.sender.avatarUrl ? <img src={msg.sender.avatarUrl} className="w-full h-full object-cover" /> : msg.sender.name?.[0] || "?") : null}
                                    </div>
                                )}
                                <div className={`max-w-[75%] px-5 py-3 rounded-3xl relative text-[15px] shadow-sm leading-relaxed ${isMe
                                        ? 'bg-indigo-500 text-white rounded-br-sm'
                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-100 dark:border-zinc-700/50'
                                    }`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    <span className={`text-[9px] font-medium absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isMe ? 'right-1 text-zinc-400' : 'left-1 text-zinc-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Chat Input */}
                <form
                    onSubmit={handleSend}
                    className="bg-zinc-50 dark:bg-zinc-950 md:bg-white md:dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 md:p-6 shrink-0 md:rounded-b-[2.5rem]"
                >
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Написать сообщение..."
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/50 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-zinc-900 dark:text-zinc-100 shadow-inner"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
