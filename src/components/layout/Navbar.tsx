"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Headphones, Layers, Sigma, PenTool, User as UserIcon, LogOut, GraduationCap, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { BRAND_NAME } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/reader", label: "Ридер", icon: BookOpen },
    { href: "/shadowing", label: "Шэдоуинг", icon: Headphones },
    { href: "/review", label: "Словарь (SRS)", icon: Layers },
    { href: "/math", label: "Математика", icon: Sigma },
    { href: "/practice", label: "Тренажеры", icon: PenTool },
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
        setIsMenuOpen(false); // Close menu on navigation
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
        router.refresh();
        router.push("/login");
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4 md:gap-6 flex-1">
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-sans font-black text-xl tracking-tighter text-zinc-900 dark:text-white hidden lg:block">
                            {BRAND_NAME}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex gap-1 lg:gap-2">
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
                                    <span className="hidden xl:inline-block">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden md:flex items-center gap-2">
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

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <div className="md:hidden">
                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden pt-20 px-4 bg-white dark:bg-zinc-950"
                    >
                        <div className="flex flex-col gap-2">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-800"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-white dark:bg-zinc-800 shadow-sm"}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        {item.label}
                                    </Link>
                                );
                            })}

                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                                        >
                                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                                                <UserIcon className="w-6 h-6" />
                                            </div>
                                            Мой профиль
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-left"
                                        >
                                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-rose-500">
                                                <LogOut className="w-6 h-6" />
                                            </div>
                                            Выйти
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center p-4 rounded-2xl text-lg font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    >
                                        Войти в аккаунт
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
