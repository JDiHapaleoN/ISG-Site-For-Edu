"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Headphones, Mic, Layers, Sigma, PenTool, CalendarCheck, User as UserIcon, LogOut, GraduationCap, Menu, X, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { BRAND_NAME } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import BroadcastBanner from "./BroadcastBanner";

const NAV_ITEMS = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/reader", label: "Ридер", icon: BookOpen },
    { href: "/shadowing", label: "Шэдоуинг", icon: Headphones },
    { href: "/speaking", label: "Говорение", icon: Mic },
    { href: "/review", label: "Словарь", icon: Layers },
    { href: "/math", label: "Матем.", icon: Sigma },
    { href: "/practice", label: "Тренажеры", icon: PenTool },
    { href: "/organizer", label: "Органайзер", icon: CalendarCheck },
    { href: "/friends", label: "Друзья", icon: Users },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isMenuOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        router.refresh();
        router.push("/login");
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
            <BroadcastBanner />
            {/* ─── Top Navigation Bar ─── */}
            <nav className="py-3 sm:py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3 sm:px-4 md:px-6 w-full"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
            >
                {/* Left: Logo + Desktop Nav */}
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="font-sans font-black text-lg sm:text-xl tracking-tighter text-zinc-900 dark:text-white hidden lg:block">
                            {BRAND_NAME}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-0.5 lg:gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden xl:inline-block">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="hidden md:flex items-center gap-1.5">
                        {user ? (
                            <div className="flex items-center gap-1.5">
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

                    <div className="md:hidden">
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-40 md:hidden"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 md:hidden bg-white dark:bg-zinc-950 overflow-y-auto"
                            style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
                        >
                            <div className="flex flex-col gap-1.5 p-4 pb-[env(safe-area-inset-bottom)]">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            prefetch={true}
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl text-base font-bold transition-all ${isActive
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-800"
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-white dark:bg-zinc-800 shadow-sm"}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            {item.label}
                                        </Link>
                                    );
                                })}

                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                                    {user ? (
                                        <>
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 p-3.5 rounded-2xl text-base font-bold bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                                            >
                                                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                Мой профиль
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 p-3.5 rounded-2xl text-base font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-left w-full"
                                            >
                                                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-rose-500">
                                                    <LogOut className="w-5 h-5" />
                                                </div>
                                                Выйти
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="flex items-center justify-center p-3.5 rounded-2xl text-base font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        >
                                            Войти в аккаунт
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
