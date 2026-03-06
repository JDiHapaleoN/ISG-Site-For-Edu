"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Fast polling interval (3 seconds) for real-time feel without websockets
// Fast polling interval for real-time feel
const POLL_INTERVAL = 1000;

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

import { createClient } from "@/lib/supabase/client";

export default function ChatPage({ params }: { params: { friendId: string } }) {
    const friendId = params.friendId;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [myId, setMyId] = useState<string | null>(null);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch My ID on load to establish Realtime channel
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setMyId(user.id);
        });
    }, [supabase.auth]);

    // Supabase Realtime Presence for Typing Indicator
    useEffect(() => {
        if (!myId || !friendId) return;

        // Create a unique deterministic room name for these two users
        const roomName = `chat_${[myId, friendId].sort().join('-')}`;
        const channel = supabase.channel(roomName, {
            config: { presence: { key: myId } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // Check if the friend is currently typing
                const friendPresence = state[friendId] as any[];
                if (friendPresence && friendPresence.length > 0) {
                    setIsTyping(friendPresence[0].typing === true);
                } else {
                    setIsTyping(false);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track initial state
                    await channel.track({ typing: false });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [myId, friendId, supabase]);

    // Handle input change to broadcast typing status
    const handleInputChange = (val: string) => {
        setNewMessage(val);

        if (!myId || !friendId) return;
        const roomName = `chat_${[myId, friendId].sort().join('-')}`;
        const channel = supabase.channel(roomName);

        // Broadcast typing
        channel.track({ typing: true });

        // Auto-stop typing after 2 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            channel.track({ typing: false });
        }, 2000);
    };

    const { data: messages, error, mutate } = useSWR<Message[]>(
        `/api/chat?friendId=${friendId}`,
        fetcher,
        { refreshInterval: POLL_INTERVAL }
    );

    const { data: friendData } = useSWR(`/api/user/profile?id=${friendId}`, fetcher);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        // Clear typing indicator instantly
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (myId) {
            const roomName = `chat_${[myId, friendId].sort().join('-')}`;
            supabase.channel(roomName).track({ typing: false });
        }

        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            senderId: myId || "me",
            content: newMessage.trim(),
            createdAt: new Date().toISOString(),
            sender: { id: myId || "me", name: "I", avatarUrl: null }
        };

        const currentMessages = messages || [];
        setNewMessage("");

        try {
            await mutate(
                async () => {
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ friendId, content: optimisticMsg.content }),
                    });
                    if (!res.ok) throw new Error("Failed to send");

                    // Trigger a re-fetch to get the real message from DB
                    const fresh = await fetch(`/api/chat?friendId=${friendId}`).then(r => r.json());
                    return fresh;
                },
                {
                    optimisticData: [...currentMessages, optimisticMsg as unknown as Message],
                    rollbackOnError: true,
                    revalidate: false // We already revalidate in the async function
                }
            );
        } catch (error) {
            toast.error("Сообщение не отправлено");
            setNewMessage(optimisticMsg.content); // Restore
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
        <main className="fixed inset-0 pt-20 pb-20 md:pt-20 md:pb-0 md:pl-[100px] flex flex-col bg-zinc-50 dark:bg-zinc-950 z-40 relative">
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto md:py-6 h-full relative">

                {/* Chat Header */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex items-center justify-between z-10 sticky top-0 md:rounded-t-[2.5rem] shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/friends" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        {friendData || messages?.[0] ? (
                            <Link href={`/profile/${friendId}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-500 shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                                    {friendData?.avatarUrl ? <img src={friendData.avatarUrl} className="w-full h-full object-cover" /> : friendData?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg leading-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">
                                        {friendData?.name || "Друг"}
                                    </h1>
                                    <div className="h-4">
                                        {isTyping ? (
                                            <span className="text-xs text-indigo-500 font-medium animate-pulse transition-opacity">печатает...</span>
                                        ) : (
                                            <span className="text-xs text-zinc-400 font-medium">в сети</span>
                                        )}
                                    </div>
                                </div>
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
                                <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-3xl relative text-[15px] shadow-sm leading-relaxed ${isMe
                                    ? 'bg-indigo-500 text-white rounded-br-sm'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-100 dark:border-zinc-700/50'
                                    }`}>
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    <span className={`text-[10px] font-medium absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isMe ? 'right-2 text-zinc-400' : 'left-2 text-zinc-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Visual spacer for typing indicator at the bottom of messages list */}
                    {isTyping && (
                        <div className="flex justify-start w-full transition-all">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mx-2 shrink-0 animate-pulse" />
                            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="bg-zinc-50 dark:bg-zinc-950 md:bg-white md:dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 md:p-6 shrink-0 md:rounded-b-[2.5rem]"
                >
                    <div className="relative flex items-end bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/50 rounded-[2rem] shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Написать сообщение..."
                            className="w-full bg-transparent min-h-[56px] max-h-[150px] resize-none py-4 px-6 pr-14 outline-none text-zinc-900 dark:text-zinc-100 rounded-[2rem]"
                            rows={1}
                            style={{ height: newMessage.split('\n').length * 24 + 32 + 'px' }}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="absolute right-2 bottom-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                        >
                            <Send className="w-5 h-5 ml-1 group-enabled:group-hover:translate-x-0.5 group-enabled:group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                    <div className="text-center mt-2 hidden md:block">
                        <span className="text-[10px] text-zinc-400 font-medium">Enter — отправить, Shift+Enter — перенос строки</span>
                    </div>
                </form>
            </div>
        </main>
    );
}
