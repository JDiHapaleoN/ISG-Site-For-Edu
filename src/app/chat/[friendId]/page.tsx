"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Send, ArrowLeft, Loader2, Check, Share2, Mic, Paperclip } from "lucide-react";
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
    };
    read: boolean;
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
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [myId, setMyId] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const supabase = createClient();

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

    const handleSend = async (e?: any, contentOverride?: string) => {
        if (e && e.preventDefault) e.preventDefault();

        const contentToSend = (contentOverride || newMessage).trim();
        if (!contentToSend || isSending) return;

        if (!contentOverride) {
            setIsSending(true);
        }

        // Clear typing indicator instantly
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (myId) {
            const roomName = `chat_${[myId, friendId].sort().join('-')}`;
            supabase.channel(roomName).track({ typing: false });
        }

        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            senderId: myId || "me",
            content: contentToSend,
            createdAt: new Date().toISOString(),
            sender: { id: myId || "me", name: "I", avatarUrl: null }
        };

        const currentMessages = messages || [];
        if (!contentOverride) setNewMessage("");

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
            if (!contentOverride) setNewMessage(optimisticMsg.content); // Restore
        } finally {
            if (!contentOverride) setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const uploadAndSendMedia = async (fileOrBlob: Blob | File, filename: string, type: 'audio' | 'image' | 'video') => {
        if (!myId) return;
        setIsUploading(true);
        try {
            const ext = filename.split('.').pop() || 'tmp';
            // Start path with myId to satisfy typical Supabase RLS policies
            const path = `${myId}/chat_${Date.now()}.${ext}`;

            // Reusing existing public avatars bucket
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(path, fileOrBlob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path);

            let specialContent = `[${type.toUpperCase()}]${publicUrl}`;

            await handleSend(undefined, specialContent);
        } catch (error: any) {
            console.error("Media upload error:", error);
            toast.error(`Ошибка отправки: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await uploadAndSendMedia(audioBlob, 'audio.webm', 'audio');
                setIsRecording(false);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            // Better error reporting for insecure contexts like HTTP on mobile devices
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                toast.error("Нет доступа к микрофону. Разрешите доступ в браузере.");
            } else {
                toast.error("Ошибка микрофона. Убедитесь, что записываете через HTTPS или Localhost.");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error("Файл слишком большой. Максимум 20МБ.");
            return;
        }

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            toast.error("Пожалуйста, выберите изображение или видео.");
            return;
        }

        uploadAndSendMedia(file, file.name, isImage ? 'image' : 'video');
    };

    const renderMessageContent = (content: string) => {
        if (content.startsWith('[VOICE]')) {
            const url = content.replace('[VOICE]', '');
            return (
                <div className="flex items-center gap-2 pr-10">
                    <audio src={url} controls className="h-10 w-48 shrink-0" />
                </div>
            );
        }
        if (content.startsWith('[IMAGE]')) {
            const url = content.replace('[IMAGE]', '');
            return (
                <div className="pr-10">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} className="w-full max-w-[200px] sm:max-w-xs h-auto rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700/50" alt="Chat attachment" loading="lazy" />
                    </a>
                </div>
            );
        }
        if (content.startsWith('[VIDEO]')) {
            const url = content.replace('[VIDEO]', '');
            return (
                <div className="pr-10">
                    <video src={url} controls className="w-full max-w-[200px] sm:max-w-xs h-auto rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700/50" />
                </div>
            );
        }
        return <p className="whitespace-pre-wrap break-words pr-12">{content}</p>;
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
            <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto md:py-6 h-full relative">

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
                                        ) : friendData?.activeReaderText ? (
                                            <span className="text-xs text-zinc-500 font-medium truncate max-w-[150px] inline-block">
                                                📖 {friendData.activeReaderText}
                                            </span>
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
                                <div className={`max-w-[85%] px-4 pt-3 pb-2 rounded-3xl relative text-[15px] shadow-sm leading-relaxed flex flex-col ${isMe
                                    ? 'bg-indigo-500 text-white rounded-br-sm'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-100 dark:border-zinc-700/50'
                                    }`}>
                                    {renderMessageContent(msg.content)}
                                    <div className={`flex items-center gap-1 self-end translate-y-1 -mt-2 -mr-1 ${isMe ? 'text-indigo-200' : 'text-zinc-400'}`}>
                                        <span className="text-[10px] font-medium opacity-80">
                                            {new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {isMe && (
                                            <div className="flex -space-x-1.5 translate-y-[1px]">
                                                <Check className={`w-3 h-3 ${msg.read ? 'text-indigo-200 opacity-100' : 'opacity-60'}`} />
                                                {msg.read && <Check className="w-3 h-3 text-indigo-200 opacity-100 -ml-1.5" />}
                                            </div>
                                        )}
                                    </div>
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

                {/* Chat Input Area */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="bg-zinc-50 dark:bg-zinc-950 md:bg-white md:dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 md:p-6 shrink-0 md:rounded-b-[2.5rem]"
                >
                    <div className="flex items-end gap-2 md:gap-4">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button
                            type="button"
                            className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-500 rounded-full transition-all shrink-0 mb-1"
                            title="Прикрепить"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Paperclip className={`w-6 h-6 ${isUploading ? 'animate-pulse' : ''}`} />
                        </button>

                        <div className="relative flex-1 flex items-end bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/50 rounded-[2rem] shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            {isRecording ? (
                                <div className="w-full h-[56px] flex items-center px-6 gap-3 select-none">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-zinc-900 dark:text-zinc-100 font-medium animate-pulse">Запись голоса...</span>
                                </div>
                            ) : (
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Написать сообщение..."
                                    className="w-full bg-transparent min-h-[56px] max-h-[150px] resize-none py-4 px-6 pr-14 outline-none text-zinc-900 dark:text-zinc-100 rounded-[2rem]"
                                    rows={1}
                                    style={{ height: newMessage.split('\n').length * 24 + 32 + 'px' }}
                                />
                            )}
                            {!isRecording && (
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending || isUploading}
                                    className="absolute right-2 bottom-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1 group-enabled:group-hover:translate-x-0.5 group-enabled:group-hover:-translate-y-0.5 transition-transform" />}
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            className={`p-3 rounded-full transition-all shrink-0 mb-1 ${isRecording ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md animate-bounce' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500'}`}
                            title="Голосовое сообщение"
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={isUploading || isSending}
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="text-center mt-2 hidden md:flex items-center justify-center gap-4">
                        <span className="text-[10px] text-zinc-400 font-medium">Enter — отправить, Shift+Enter — перенос строки</span>
                    </div>
                </form>
            </div>
        </main>
    );
}
