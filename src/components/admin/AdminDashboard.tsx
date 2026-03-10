"use client";

import { useEffect, useState } from "react";
import {
    Users, BookOpen, MessageSquare, Database, LogOut,
    Trash2, KeyRound, LayoutDashboard, Globe, History,
    Search, ChevronRight, Menu, X, Filter, Trash, Activity,
    AlertCircle, ShieldAlert, CheckCircle2, Terminal, PenTool,
    RefreshCw, ShieldX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AdminTab = "dashboard" | "users" | "dictionary" | "cache" | "broadcasts" | "logs";

interface AdminStats {
    userCount: number;
    englishWords: number;
    germanWords: number;
    messages: number;
    cacheEntries: number;
    broadcasts: number;
}

interface UserData {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    lastActive: string | null;
}

interface WordData {
    id: string;
    term: string;
    translation: string | null;
    module: string;
    createdAt: string;
    user: { email: string; name: string | null };
}

interface CacheData {
    id: string;
    word: string;
    module: string;
    translationData: string;
    createdAt: string;
}

interface BroadcastData {
    id: string;
    title: string;
    content: string;
    type: string;
    isActive: boolean;
    createdAt: string;
}

interface LogData {
    id: string;
    level: string;
    message: string;
    context: string | null;
    createdAt: string;
    metadata: any;
    user: { email: string; name: string | null } | null;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [words, setWords] = useState<WordData[]>([]);
    const [cache, setCache] = useState<CacheData[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    const [broadcasts, setBroadcasts] = useState<BroadcastData[]>([]);
    const [logs, setLogs] = useState<LogData[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [moduleFilter, setModuleFilter] = useState<'english' | 'german'>('english');

    useEffect(() => {
        fetchData();
    }, [activeTab, moduleFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "dashboard") {
                const res = await fetch('/api/admin/stats');
                setStats(await res.json());
                // Also fetch logs for activity feed
                const logsRes = await fetch('/api/admin/logs?limit=10');
                setLogs(await logsRes.json());
            } else if (activeTab === "users") {
                const res = await fetch('/api/admin/users');
                setUsers(await res.json());
            } else if (activeTab === "dictionary") {
                const res = await fetch(`/api/admin/dictionary?module=${moduleFilter}`);
                setWords(await res.json());
            } else if (activeTab === "cache") {
                const res = await fetch('/api/admin/cache');
                setCache(await res.json());
            } else if (activeTab === "broadcasts") {
                const res = await fetch('/api/admin/broadcast');
                setBroadcasts(await res.json());
            } else if (activeTab === "logs") {
                const res = await fetch('/api/admin/logs');
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const createLog = async (level: string, message: string, context: string, metadata: any = {}) => {
        try {
            await fetch('/api/admin/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, message, context, metadata })
            });
        } catch (e) {
            console.error("Log error:", e);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Вы уверены, что хотите полностью удалить пользователя ${email}?`)) return;
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            createLog('warn', `Удален пользователь: ${email}`, 'UserManagement', { userId: id });
            fetchData();
        }
    };

    const handleDeleteWord = async (id: string) => {
        if (!confirm("Удалить это слово из словаря пользователя?")) return;
        const res = await fetch(`/api/admin/dictionary?id=${id}&module=${moduleFilter}`, { method: 'DELETE' });
        if (res.ok) {
            createLog('info', `Удалено слово из словаря (${moduleFilter})`, 'DictionaryManagement', { wordId: id });
            fetchData();
        }
    };

    const handleDeleteCache = async (id: string) => {
        if (!confirm("Удалить этот перевод из кэша?")) return;
        const res = await fetch(`/api/admin/cache?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            createLog('info', 'Очищена запись кэша перевода', 'CacheManagement', { cacheId: id });
            fetchData();
        }
    };

    const handleBulkDelete = async (module: string) => {
        const count = selectedIds.length;
        if (count === 0 && module !== 'logs-all') return;

        const confirmMsg = module === 'logs-all'
            ? "Удалить ВСЕ системные логи? Это действие необратимо."
            : `Удалить выбранные элементы (${count})?`;

        if (!confirm(confirmMsg)) return;

        const res = await fetch('/api/admin/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module: module === 'logs-all' ? 'logs' : module,
                ids: module === 'logs-all' ? 'all' : selectedIds
            })
        });

        if (res.ok) {
            createLog('warn', `Массовое удаление (${module})`, 'BulkAction', { count: count || 'all' });
            setSelectedIds([]);
            fetchData();
        }
    };

    const menuItems = [
        { id: "dashboard", label: "Сводка", icon: LayoutDashboard },
        { id: "users", label: "Пользователи", icon: Users },
        { id: "dictionary", label: "Живой Словарь", icon: BookOpen },
        { id: "cache", label: "Кэш Переводов", icon: Database },
        { id: "broadcasts", label: "Объявления", icon: Globe },
        { id: "logs", label: "Логи системы", icon: Activity },
    ];

    return (
        <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">

            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800"
            >
                {isSidebarOpen ? <X /> : <Menu />}
            </button>

            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 z-50 w-72 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 transform 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full p-6">
                    <div className="mb-10 px-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <KeyRound className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">ISG Admin</h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as AdminTab); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Версия панели</p>
                            <p className="text-sm font-semibold">3.0.0 (Enterprise)</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Выход
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden p-4 md:p-8 lg:p-12">
                <header className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold">{menuItems.find(i => i.id === activeTab)?.label}</h2>
                            <p className="text-zinc-500">Управление образовательной платформой</p>
                        </div>

                        {/* Search / Context Actions */}
                        {(activeTab === "dictionary" || activeTab === "users" || activeTab === "cache" || activeTab === "logs") && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-all disabled:opacity-50"
                                    title="Обновить данные"
                                >
                                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                                </button>

                                {activeTab === 'logs' && (
                                    <button
                                        onClick={() => handleBulkDelete('logs-all')}
                                        className="h-11 px-4 bg-red-600/10 text-red-600 border border-red-600/20 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <ShieldX size={16} />
                                        Очистить всё
                                    </button>
                                )}

                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => handleBulkDelete(
                                            activeTab === 'dictionary' ? `${moduleFilter}-dictionary` : activeTab
                                        )}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all font-bold animate-in zoom-in duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Удалить ({selectedIds.length})
                                    </button>
                                )}
                                {activeTab === "dictionary" && (
                                    <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <button
                                            onClick={() => setModuleFilter('english')}
                                            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${moduleFilter === 'english' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}
                                        >
                                            English
                                        </button>
                                        <button
                                            onClick={() => setModuleFilter('german')}
                                            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${moduleFilter === 'german' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}
                                        >
                                            German
                                        </button>
                                    </div>
                                )}
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        placeholder="Поиск..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 focus:w-64 transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="min-h-[400px]">
                    {activeTab === "dashboard" && <DashboardSection stats={stats} loading={loading} logs={logs} />}
                    {activeTab === "users" && <UsersSection users={users} loading={loading} searchTerm={searchTerm} onDelete={handleDeleteUser} onEdit={setEditingUser} />}
                    {activeTab === "dictionary" && <DictionarySection words={words} loading={loading} searchTerm={searchTerm} onDelete={handleDeleteWord} selectedIds={selectedIds} onSelectUpdate={setSelectedIds} />}
                    {activeTab === "cache" && <CacheSection cache={cache} loading={loading} searchTerm={searchTerm} onDelete={handleDeleteCache} selectedIds={selectedIds} onSelectUpdate={setSelectedIds} />}
                    {activeTab === "broadcasts" && <BroadcastsSection broadcasts={broadcasts} loading={loading} onRefresh={fetchData} />}
                    {activeTab === "logs" && <LogsSection logs={logs} loading={loading} />}
                </div>

                <AnimatePresence>
                    {editingUser && (
                        <EditUserModal
                            user={editingUser}
                            onClose={() => setEditingUser(null)}
                            onRefresh={fetchData}
                            createLog={createLog}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div >
    );
}

// ============================================
// SECTIONS
// ============================================

function DashboardSection({ stats, loading, logs }: { stats: AdminStats | null, loading: boolean, logs: LogData[] }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-8 h-8 text-blue-500" />} title="Всего учеников" value={loading ? "..." : stats?.userCount} color="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard icon={<BookOpen className="w-8 h-8 text-green-500" />} title="Слова в системе" value={loading ? "..." : (stats?.englishWords || 0) + (stats?.germanWords || 0)} color="bg-green-50 dark:bg-green-500/10" />
                <StatCard icon={<MessageSquare className="w-8 h-8 text-purple-500" />} title="Личные сообщения" value={loading ? "..." : stats?.messages} color="bg-purple-50 dark:bg-purple-500/10" />
                <StatCard icon={<Globe className="w-8 h-8 text-orange-500" />} title="Объявления" value={loading ? "..." : stats?.broadcasts} color="bg-orange-50 dark:bg-orange-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        Активность платформы
                    </h3>
                    <div className="h-64 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        График активности будет доступен после накопления данных
                    </div>
                </div>
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <Globe className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
                    <h3 className="text-xl font-bold mb-2">Статус системы</h3>
                    <p className="text-indigo-100 text-sm mb-6">Все модули ИИ работают в штатном режиме</p>
                    <div className="space-y-3">
                        <SystemRow label="Сервер" value="Stable" status="online" />
                        <SystemRow label="Gemini API" value="Connected" status="online" />
                        <SystemRow label="Database" value="Active" status="online" />
                        <SystemRow label="Realtime" value="Listening" status="online" />
                    </div>
                </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Последние события
                    </h3>
                    <button className="text-indigo-500 text-sm font-semibold hover:underline">См. все логи</button>
                </div>
                <div className="space-y-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
                            {logs.length > 0 ? logs.slice(0, 5).map(log => (
                                <ActivityItem
                                    key={log.id}
                                    icon={
                                        log.level === 'error' ? <ShieldAlert className="w-3 h-3" /> :
                                            log.level === 'warn' ? <AlertCircle className="w-3 h-3" /> :
                                                log.level === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                                                    <Activity className="w-3 h-3" />
                                    }
                                    color={
                                        log.level === 'error' ? 'bg-red-500' :
                                            log.level === 'warn' ? 'bg-amber-500' :
                                                log.level === 'success' ? 'bg-emerald-500' :
                                                    'bg-blue-500'
                                    }
                                    title={log.context || 'System Event'}
                                    time={new Date(log.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    description={log.message}
                                />
                            )) : (
                                <p className="text-zinc-500 italic text-sm">Событий за последнее время не зафиксировано</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UsersSection({
    users,
    loading,
    searchTerm,
    onDelete,
    onEdit
}: {
    users: UserData[],
    loading: boolean,
    searchTerm: string,
    onDelete: (id: string, email: string) => void,
    onEdit: (user: UserData) => void
}) {
    const filtered = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
                            <th className="p-6 font-medium">Пользователь</th>
                            <th className="p-6 font-medium">ID (Supabase)</th>
                            <th className="p-6 font-medium">Статус / Активность</th>
                            <th className="p-6 font-medium">Регистрация</th>
                            <th className="p-6 font-medium text-right">Управление</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.map(user => (
                            <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{user.name || 'Без имени'}</div>
                                            <div className="text-sm text-zinc-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-xs text-zinc-500 font-mono italic">{user.id}</td>
                                <td className="p-6 text-sm">
                                    {user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 1000 * 60 * 5) ? (
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Online
                                        </div>
                                    ) : (
                                        <div className="text-zinc-400 text-xs">
                                            {user.lastActive
                                                ? `Был: ${new Date(user.lastActive).toLocaleDateString()} ${new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : 'Никогда'}
                                        </div>
                                    )}
                                </td>
                                <td className="p-6 text-sm">{new Date(user.createdAt).toLocaleDateString("ru-RU", { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                                <td className="p-6">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl"
                                        >
                                            <PenTool size={20} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id, user.email)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DictionarySection({
    words,
    loading,
    searchTerm,
    onDelete,
    selectedIds,
    onSelectUpdate
}: {
    words: WordData[],
    loading: boolean,
    searchTerm: string,
    onDelete: (id: string) => void,
    selectedIds: string[],
    onSelectUpdate: (ids: string[]) => void
}) {
    const filtered = words.filter(w => w.term.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectUpdate(selectedIds.filter(i => i !== id));
        } else {
            onSelectUpdate([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === filtered.length) {
            onSelectUpdate([]);
        } else {
            onSelectUpdate(filtered.map(w => w.id));
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
                            <th className="p-6 font-medium w-10">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="p-6 font-medium">Слово / Выражение</th>
                            <th className="p-6 font-medium">Перевод</th>
                            <th className="p-6 font-medium">Пользователь</th>
                            <th className="p-6 font-medium">Дата</th>
                            <th className="p-6 font-medium text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.map(word => (
                            <tr key={word.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${selectedIds.includes(word.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                                <td className="p-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(word.id)}
                                        onChange={() => toggleSelect(word.id)}
                                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="p-6 font-bold text-lg">{word.term}</td>
                                <td className="p-6 text-indigo-600 dark:text-indigo-400 font-medium">{word.translation}</td>
                                <td className="p-6">
                                    <div className="text-sm">{word.user.name || 'Incognito'}</div>
                                    <div className="text-xs text-zinc-500">{word.user.email}</div>
                                </td>
                                <td className="p-6 text-xs text-zinc-500">{new Date(word.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 text-right">
                                    <button onClick={() => onDelete(word.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CacheSection({
    cache,
    loading,
    searchTerm,
    onDelete,
    selectedIds,
    onSelectUpdate
}: {
    cache: CacheData[],
    loading: boolean,
    searchTerm: string,
    onDelete: (id: string) => void,
    selectedIds: string[],
    onSelectUpdate: (ids: string[]) => void
}) {
    const filtered = cache.filter(c => c.word.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectUpdate(selectedIds.filter(i => i !== id));
        } else {
            onSelectUpdate([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === filtered.length) {
            onSelectUpdate([]);
        } else {
            onSelectUpdate(filtered.map(c => c.id));
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
                            <th className="p-6 font-medium w-10">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="p-6 font-medium">Оригинал</th>
                            <th className="p-6 font-medium">Модуль</th>
                            <th className="p-6 font-medium">Данные JSON</th>
                            <th className="p-6 font-medium">Сохранено</th>
                            <th className="p-6 font-medium text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.map(item => (
                            <tr key={item.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                                <td className="p-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                        className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm font-semibold">{item.word}</span>
                                </td>
                                <td className="p-6">
                                    <span className={`text-xs uppercase px-2 py-0.5 rounded-md font-bold ${item.module === 'english' ? 'text-blue-500 bg-blue-50' : 'text-amber-500 bg-amber-50'}`}>
                                        {item.module}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="max-w-xs truncate text-xs text-zinc-400 font-mono italic" title={item.translationData}>
                                        {item.translationData}
                                    </div>
                                </td>
                                <td className="p-6 text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 text-right">
                                    <button onClick={() => onDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-500">
                                        <Filter size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BroadcastsSection({ broadcasts, loading, onRefresh }: { broadcasts: BroadcastData[], loading: boolean, onRefresh: () => void }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("info");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, type })
            });
            if (res.ok) {
                setTitle("");
                setContent("");
                setIsCreating(false);
                onRefresh();
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Удалить объявление?")) return;
        const res = await fetch(`/api/admin/broadcast?id=${id}`, { method: 'DELETE' });
        if (res.ok) onRefresh();
    };

    const toggleStatus = async (id: string, current: boolean) => {
        const res = await fetch('/api/admin/broadcast', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive: !current })
        });
        if (res.ok) onRefresh();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Create Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Создать системное объявление</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Заголовок"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        />
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="info">Info (Синий)</option>
                            <option value="warning">Warning (Желтый)</option>
                            <option value="urgent">Urgent (Красный)</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Текст сообщения..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 h-24"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        Опубликовать
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? <div className="text-center p-8">Загрузка...</div> : broadcasts.map(item => (
                    <div key={item.id} className={`p-6 rounded-2xl border transition-all ${item.isActive ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/20 opacity-60'} border-zinc-200 dark:border-zinc-800 flex justify-between items-center`}>
                        <div className="flex gap-4">
                            <div className={`w-2 h-full rounded-full ${item.type === 'urgent' ? 'bg-red-500' : item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                            <div>
                                <h4 className="font-bold flex items-center gap-2">
                                    {item.title}
                                    {!item.isActive && <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded uppercase">Черновик</span>}
                                </h4>
                                <p className="text-sm text-zinc-500">{item.content}</p>
                                <p className="text-[10px] text-zinc-400 mt-2 lowercase">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => toggleStatus(item.id, item.isActive)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                {item.isActive ? <X size={18} className="text-zinc-400" /> : <Globe size={18} className="text-green-500" />}
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// HELPERS
// ============================================

function LogsSection({ logs, loading }: { logs: LogData[], loading: boolean }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
                            <th className="p-6 font-medium">Событие</th>
                            <th className="p-6 font-medium">Контекст</th>
                            <th className="p-6 font-medium">Админ / Пользователь</th>
                            <th className="p-6 font-medium">Дата и время</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        ) : logs.map(log => (
                            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {log.level === 'error' && <ShieldAlert className="w-5 h-5 text-red-500" />}
                                            {log.level === 'warn' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                                            {log.level === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            {log.level === 'info' && <Terminal className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{log.message}</div>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <pre className="mt-2 text-[10px] bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg overflow-x-auto max-w-xs font-mono">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                        {log.context || 'General'}
                                    </span>
                                </td>
                                <td className="p-6">
                                    {log.user ? (
                                        <div>
                                            <div className="text-sm font-medium">{log.user.name || 'Admin'}</div>
                                            <div className="text-xs text-zinc-400">{log.user.email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-zinc-400 italic font-mono">system</span>
                                    )}
                                </td>
                                <td className="p-6 text-xs text-zinc-500">
                                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && !loading && (
                    <div className="p-12 text-center text-zinc-500 italic">Событий пока нет</div>
                )}
            </div>
        </div>
    );
}

function EditUserModal({
    user,
    onClose,
    onRefresh,
    createLog
}: {
    user: UserData,
    onClose: () => void,
    onRefresh: () => void,
    createLog: (level: string, message: string, context: string, metadata?: any) => Promise<void>
}) {
    const [name, setName] = useState(user.name || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name: name !== user.name ? name : undefined,
                    newPassword: password || undefined
                })
            });

            if (res.ok) {
                if (password) await createLog('warn', `Сброшен пароль пользователя: ${user.email}`, 'UserManagement', { userId: user.id });
                if (name !== user.name) await createLog('info', `Изменено имя пользователя: ${user.email}`, 'UserManagement', { oldName: user.name, newName: name });

                onRefresh();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Ошибка обновления');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Редактировать профиль</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">Имя ученика</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Введите имя"
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">Новый пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Оставьте пустым, если не нужно менять"
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1 ml-1">Пароль будет изменен только в системе Supabase Auth</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Сохранение...' : 'Обновить'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: any, color: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-zinc-500 text-sm mb-1 font-medium">{title}</p>
                <p className="text-3xl font-black">{value}</p>
            </div>
        </div>
    );
}

function SystemRow({ label, value, status }: { label: string, value: string, status?: 'online' | 'offline' | 'pending' }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-indigo-400/30">
            <span className="text-indigo-200 text-sm">{label}</span>
            <span className="text-sm font-bold flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                {value}
            </span>
        </div>
    );
}

function ActivityItem({ icon, color, title, time, description }: { icon: React.ReactNode, color: string, title: string, time: string, description: string }) {
    return (
        <div className="relative">
            <div className={`absolute -left-[27px] top-1 w-5 h-5 rounded-full ${color} flex items-center justify-center text-white border-4 border-white dark:border-zinc-900 z-10`}>
                {icon}
            </div>
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{title}</span>
                    <span className="text-[10px] text-zinc-400">{time}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr>
            <td colSpan={5} className="p-6">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse w-full"></div>
            </td>
        </tr>
    );
}
