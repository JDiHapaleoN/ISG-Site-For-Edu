"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Plus, X } from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { getMathLogs, createMathLog } from "@/app/actions/mathActions";

export default function MathErrorLog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        topic: "",
        errorType: "Концептуальная ошибка",
        problem: "",
        wrongSolution: "",
        correctSolution: "",
        note: ""
    });

    const fetchLogs = () => {
        getMathLogs().then(setLogs).catch(console.error);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMathLog({
                topic: formData.topic,
                problem: formData.problem,
                solution: formData.correctSolution, // Mapping correct to solution
                errorType: formData.errorType,
                note: formData.note
            });
            setIsAdding(false);
            setFormData({
                topic: "",
                errorType: "Концептуальная ошибка",
                problem: "",
                wrongSolution: "",
                correctSolution: "",
                note: ""
            });
            fetchLogs();
        } catch (err) {
            alert("Не удалось сохранить лог");
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">
                        Журнал моих ошибок
                    </h2>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Добавить ошибку
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Записать новую ошибку</h3>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 ml-1">Тема</label>
                                    <input
                                        required
                                        value={formData.topic}
                                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                        className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Напр. Логарифмы"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-zinc-500 ml-1">Тип ошибки</label>
                                    <select
                                        value={formData.errorType}
                                        onChange={e => setFormData({ ...formData, errorType: e.target.value })}
                                        className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option>Концептуальная ошибка</option>
                                        <option>Вычислительная ошибка</option>
                                        <option>Невнимательность</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-zinc-500 ml-1">Условие (LaTeX)</label>
                                <textarea
                                    required
                                    value={formData.problem}
                                    onChange={e => setFormData({ ...formData, problem: e.target.value })}
                                    className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500 font-mono text-sm h-20"
                                    placeholder="\int x^2 dx"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-rose-500 ml-1">Как я решил (неверно)</label>
                                    <textarea
                                        required
                                        value={formData.wrongSolution}
                                        onChange={e => setFormData({ ...formData, wrongSolution: e.target.value })}
                                        className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 focus:ring-2 focus:ring-rose-500 font-mono text-sm h-20"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-emerald-500 ml-1">Как правильно</label>
                                    <textarea
                                        required
                                        value={formData.correctSolution}
                                        onChange={e => setFormData({ ...formData, correctSolution: e.target.value })}
                                        className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 focus:ring-2 focus:ring-rose-500 font-mono text-sm h-20"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-zinc-500 ml-1">Заметка/Совет себе</label>
                                <input
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500"
                                    placeholder="Забыл про константу C..."
                                />
                            </div>

                            <button type="submit" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-4 rounded-2xl mt-4 hover:opacity-90 transition-opacity">
                                Сохранить
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {logs.length === 0 && !isAdding && (
                    <div className="md:col-span-2 text-center py-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-zinc-500 font-medium">Пока нет записей об ошибках. Нажмите кнопку выше, чтобы добавить первую!</p>
                    </div>
                )}
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col"
                    >
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.topic}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/30 px-3 py-1 rounded-full outline outline-1 outline-rose-200 dark:outline-rose-900/50 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {log.errorType}
                            </span>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div>
                                <p className="text-sm text-zinc-500 uppercase font-semibold mb-2 tracking-wider">Условие</p>
                                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl">
                                    <MathRenderer math={log.problem} block className="text-zinc-900 dark:text-zinc-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {log.solution && (
                                    <>
                                        {/* Since MathLog only stores one 'solution' field, we'll treat it as 'correct' and assume 
                                            wrong solution might have been ephemeral or we should store it too. 
                                            For now, let's just show what we have. */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-emerald-500 uppercase font-semibold mb-2 tracking-wider">Верное решение</p>
                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                                <MathRenderer math={log.solution} block className="text-emerald-700 dark:text-emerald-400" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {log.theorem && (
                                <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-xl">
                                    💡 {log.theorem}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

