"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, MessageSquare, Database, LogOut, Trash2, KeyRound } from "lucide-react";

interface AdminStats {
    userCount: number;
    englishWords: number;
    germanWords: number;
    messages: number;
    cacheEntries: number;
}

interface UserData {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoadingStats(false);
            })
            .catch(err => console.error(err));

        fetch('/api/admin/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoadingUsers(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Вы уверены, что хотите удалить пользователя ${email}? Это действие необратимо!`)) return;

        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
                alert('Пользователь успешно удален');
            } else {
                alert('Ошибка при удалении');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">ISG Панель Управления</h1>
                        <p className="text-sm text-zinc-500">Системная статистика и пользователи</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Выйти</span>
                    </button>
                </div>

                {/* Stats Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Users className="w-8 h-8 text-blue-500" />}
                        title="Пользователи"
                        value={loadingStats ? '...' : stats?.userCount}
                        color="bg-blue-50 dark:bg-blue-500/10"
                    />
                    <StatCard
                        icon={<BookOpen className="w-8 h-8 text-green-500" />}
                        title="Карточки (EN+DE)"
                        value={loadingStats ? '...' : (stats?.englishWords || 0) + (stats?.germanWords || 0)}
                        color="bg-green-50 dark:bg-green-500/10"
                    />
                    <StatCard
                        icon={<MessageSquare className="w-8 h-8 text-purple-500" />}
                        title="Сообщения"
                        value={loadingStats ? '...' : stats?.messages}
                        color="bg-purple-50 dark:bg-purple-500/10"
                    />
                    <StatCard
                        icon={<Database className="w-8 h-8 text-orange-500" />}
                        title="Записи в Кэше ИИ"
                        value={loadingStats ? '...' : stats?.cacheEntries}
                        color="bg-orange-50 dark:bg-orange-500/10"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-500" />
                            База пользователей
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
                                    <th className="p-4 font-medium">ID (Supabase)</th>
                                    <th className="p-4 font-medium">Имя</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Регистрация</th>
                                    <th className="p-4 font-medium text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-zinc-500">Загрузка пользователей...</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-zinc-500">Пользователи не найдены.</td>
                                    </tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4 text-xs text-zinc-500 font-mono">{user.id.substring(0, 8)}...</td>
                                            <td className="p-4 font-medium">{user.name || 'Без имени'}</td>
                                            <td className="p-4 text-sm">{user.email}</td>
                                            <td className="p-4 text-sm text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 flex items-center justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const newPass = prompt("Введите новый пароль для " + user.email);
                                                        if (!newPass) return;
                                                        try {
                                                            const res = await fetch('/api/admin/users', {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: user.id, newPassword: newPass })
                                                            });
                                                            if (res.ok) alert('Пароль успешно изменен');
                                                            else {
                                                                const err = await res.json();
                                                                alert('Ошибка: ' + err.error);
                                                            }
                                                        } catch (e) {
                                                            alert('Сетевая ошибка');
                                                        }
                                                    }}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                                                    title="Сменить пароль"
                                                >
                                                    <KeyRound className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                                    title="Удалить профиль"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: any, color: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-zinc-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
        </div>
    );
}
