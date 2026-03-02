"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_NAME } from "@/lib/constants";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side Validation
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError("Пожалуйста, введите корректный email адрес");
            return;
        }
        if (password.length < 6) {
            setError("Пароль должен содержать минимум 6 символов");
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError("Неверный адрес почты или пароль. Пожалуйста, попробуйте снова.");
            setIsLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        x: [0, -100, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 relative overflow-hidden group"
                    >
                        <motion.div
                            animate={{ x: [-100, 100] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-[-100%]"
                        />
                        <ShieldCheck className="w-10 h-10 text-white relative z-10" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white font-sans text-center">
                        {BRAND_NAME}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-center font-medium max-w-[280px]">
                        Ваш технологичный путь к академическим успехам
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none relative">
                    <div className="absolute top-0 right-10 -translate-y-1/2 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-700">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">Вход в систему</h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Эл. почта</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="name@university.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">Пароль</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-semibold flex gap-3 items-center"
                            >
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Войти в портал</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 text-center">
                        <p className="text-zinc-500 font-medium">
                            Впервые здесь?{" "}
                            <Link href="/register" className="text-indigo-500 font-bold hover:text-indigo-600 transition-colors inline-flex items-center gap-1">
                                Создать аккаунт <ArrowRight className="w-3 h-3" />
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer text */}
                <p className="text-center mt-12 text-zinc-400 dark:text-zinc-500 text-xs font-medium tracking-widest uppercase">
                    &copy; 2024 {BRAND_NAME} Study Hub. Все права защищены.
                </p>
            </motion.div>
        </div>
    );
}
