"use client";

import { useState, useEffect } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const auth = localStorage.getItem("admin_auth");
        if (auth === "true") {
            setIsAuthenticated(true);
        }
        setIsChecking(false);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "5572523admin") {
            localStorage.setItem("admin_auth", "true");
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPassword("");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_auth");
        setIsAuthenticated(false);
    };

    if (isChecking) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950 p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                            <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Админ Панель</h1>
                    <p className="text-zinc-500 text-center mb-8 text-sm">Введите пароль для доступа к управлению системой.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Пароль администратора"
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all dark:bg-zinc-800/50 ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-xs mt-2 ml-1">Неверный пароль. Попробуйте еще раз.</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors"
                        >
                            Войти
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return <AdminDashboard onLogout={handleLogout} />;
}
