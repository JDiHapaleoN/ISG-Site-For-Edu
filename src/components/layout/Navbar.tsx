"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Headphones, Layers, Sigma, PenTool, User as UserIcon, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/reader", label: "Ридер", icon: BookOpen },
    { href: "/shadowing", label: "Шэдоуинг", icon: Headphones },
    { href: "/review", label: "Словарь (SRS)", icon: Layers },
    { href: "/math", label: "Математика", icon: Sigma },
    { href: "/practice", label: "Тренажеры ИИ", icon: PenTool },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            router.refresh();
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-6">
            <div className="flex gap-2 md:gap-6 overflow-x-auto w-full max-w-6xl items-center no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${isActive
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline-block">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {user ? (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/profile"
                            className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-colors"
                            title="Профиль"
                        >
                            <UserIcon className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="p-2 text-zinc-500 hover:text-rose-500 transition-colors"
                            title="Выйти"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="text-sm font-bold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-sans"
                    >
                        Войти
                    </Link>
                )}
                <ThemeToggle />
            </div>
        </nav >
    );
}
