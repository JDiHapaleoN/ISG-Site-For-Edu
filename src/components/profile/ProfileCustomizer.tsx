"use client";

import { useState, useEffect } from "react";
import { User, Palette, Camera, Check, X, LogOut } from "lucide-react";
import { updateProfile } from "@/app/actions/profileActions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileCustomizerProps {
    user: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        bannerColor: string | null;
        email: string;
    };
}

const COLORS = [
    "#6366f1", "#ec4899", "#f43f5e", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#71717a"
];

const AVATARS = [
    "🚀", "🧠", "📚", "🎨", "🧬", "💻", "⚡", "🌟", "🎯", "🎓"
];

export default function ProfileCustomizer({ user }: ProfileCustomizerProps) {
    const [name, setName] = useState(user.name || "");
    const [avatar, setAvatar] = useState(user.avatarUrl || AVATARS[0]);
    const [color, setColor] = useState(user.bannerColor || COLORS[0]);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const log = (msg: string) => {
        console.log(msg);
        setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    // Sync state with props when they change (e.g., after server revalidation)
    useEffect(() => {
        setName(user.name || "");
        setAvatar(user.avatarUrl || AVATARS[0]);
        setColor(user.bannerColor || COLORS[0]);
    }, [user.name, user.avatarUrl, user.bannerColor]);

    const cropImageToSquare = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;

                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;

                ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas to Blob failed"));
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                log("Image load error: " + JSON.stringify(e));
                reject(new Error("Could not load image"));
            };
            img.src = url;
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        log(`Choosing file: ${file.name} (${Math.round(file.size / 1024)} KB)`);

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("Файл слишком большой. Максимальный размер - 5МБ.");
            return;
        }

        setUploading(true);
        try {
            log("Processing image (crop)...");
            const croppedBlob = await cropImageToSquare(file);
            log("Image cropped. Starting Supabase upload...");

            const fileExt = 'jpg';
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: 'image/jpeg'
                });

            if (error) {
                log("Supabase Error: " + error.message);
                throw error;
            }

            log("Upload success! Path: " + data.path);

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path);

            log("Generated URL: " + publicUrl.substring(0, 30) + "...");
            setAvatar(publicUrl);
        } catch (err: any) {
            log("FAILED: " + (err.message || "Unknown error"));
            alert(`Ошибка: ${err.message || "Не удалось загрузить фото"}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log("Saving profile with avatar:", avatar);
            await updateProfile({
                name,
                avatarUrl: avatar,
                bannerColor: color
            });
            router.refresh(); // Extra insurance
            setIsOpen(false);
        } catch (err: any) {
            console.error("Save profile error:", err);
            alert(`Ошибка при сохранении профиля: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all shadow-sm hover:shadow-md"
            >
                <Palette className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black">Настройка профиля</h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Profile Photo Upload */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Фото профиля</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl overflow-hidden shadow-inner flex-shrink-0 border-2 border-transparent transition-all">
                                        {uploading ? (
                                            <div className="animate-pulse flex items-center justify-center w-full h-full bg-zinc-200 dark:bg-zinc-700">
                                                <Camera className="w-8 h-8 text-zinc-400" />
                                            </div>
                                        ) : avatar.startsWith('http') ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            avatar
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="cursor-pointer group flex flex-col">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                                                <Camera className="w-4 h-4" />
                                                {uploading ? "Загрузка..." : "Загрузить фото"}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <span className="text-[10px] text-zinc-400 mt-2 font-medium">Обрезка в квадрат происходит автоматически</span>
                                        </label>

                                        {avatar.startsWith('http') && !uploading && (
                                            <button
                                                onClick={() => setAvatar(AVATARS[0])}
                                                className="text-[10px] font-bold text-rose-500 hover:underline px-1"
                                            >
                                                Вернуть стикер
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Имя исследователя</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ваше имя"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-zinc-100"
                                />
                            </div>

                            {/* Avatar Picker (Emojis) */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Или выберите эмодзи</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {AVATARS.map((a) => (
                                        <button
                                            key={a}
                                            onClick={() => setAvatar(a)}
                                            className={`h-12 text-2xl flex items-center justify-center rounded-xl transition-all ${avatar === a ? 'bg-indigo-500 shadow-lg scale-110' : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Цвет оформления</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            style={{ backgroundColor: c }}
                                            className={`h-10 rounded-xl transition-all flex items-center justify-center ${color === c ? 'ring-4 ring-white dark:ring-zinc-700 shadow-lg scale-105' : 'hover:scale-105'}`}
                                        >
                                            {color === c && <Check className="w-5 h-5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 space-y-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? "Сохранение..." : "Сохранить изменения"}
                                </button>

                                {/* Debug Logs Window */}
                                {debugLog.length > 0 && (
                                    <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Технический лог</span>
                                            <button onClick={() => setDebugLog([])} className="text-[10px] text-zinc-400 hover:text-zinc-600">Очистить</button>
                                        </div>
                                        <div className="space-y-1">
                                            {debugLog.map((l, i) => (
                                                <p key={i} className="text-[10px] font-mono text-zinc-500 break-all">{l}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
