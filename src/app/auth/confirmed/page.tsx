"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

export default function ConfirmedPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [45, 0, 45],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10 text-center"
            >
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40"
                    >
                        <GraduationCap className="w-10 h-10 text-white" />
                    </motion.div>
                </div>

                {/* Content Card */}
                <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 rounded-[2.5rem] p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </motion.div>

                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
                        Почта подтверждена!
                    </h1>

                    <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mb-8">
                        Регистрация успешно завершена. Теперь вы можете войти в систему под своими данными и начать обучение.
                    </p>

                    <Link
                        href="/login"
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <span>Войти в аккаунт</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{BRAND_NAME} Ecosystem</span>
                    <Sparkles className="w-3 h-3" />
                </div>
            </motion.div>
        </div>
    );
}
