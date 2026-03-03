"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, ChevronRight, ChevronLeft, Sparkles, Loader2,
    Copy, Check, Download, RotateCcw, User, GraduationCap, Target, Send, Briefcase
} from "lucide-react";

type FormData = {
    language: "de" | "en";
    fullName: string;
    dateOfBirth: string;
    country: string;
    currentEducation: string;
    program: string;
    university: string;
    degree: string;
    semester: string;
    gpa: string;
    strongSubjects: string;
    achievements: string;
    workExperience: string;
    languages: string;
    whyProgram: string;
    whyCountry: string;
    careerGoals: string;
    softSkills: string;
    hobbies: string;
    additionalInfo: string;
};

const INITIAL_FORM: FormData = {
    language: "de",
    fullName: "",
    dateOfBirth: "",
    country: "",
    currentEducation: "",
    program: "",
    university: "",
    degree: "Bachelor",
    semester: "",
    gpa: "",
    strongSubjects: "",
    achievements: "",
    workExperience: "",
    languages: "",
    whyProgram: "",
    whyCountry: "",
    careerGoals: "",
    softSkills: "",
    hobbies: "",
    additionalInfo: "",
};

const STEPS = [
    { id: 0, label: "Профиль", icon: User },
    { id: 1, label: "Образование", icon: GraduationCap },
    { id: 2, label: "Опыт", icon: Briefcase },
    { id: 3, label: "Мотивация", icon: Target },
    { id: 4, label: "Результат", icon: Send },
];

const PROGRAMS = [
    "Informatik", "Maschinenbau", "Elektrotechnik", "Wirtschaftsinformatik",
    "Betriebswirtschaftslehre (BWL)", "Medizin", "Physik", "Mathematik",
    "Chemie", "Biologie", "Architektur", "Bauingenieurwesen",
    "Mechatronik", "Computer Science", "Business Administration",
    "International Relations", "Engineering", "Data Science",
    "Другое (укажите в доп. информации)"
];

const SEMESTERS = [
    "WS 2025/26", "SS 2026", "WS 2026/27", "SS 2027", "WS 2027/28"
];

export default function MotivationLetterGenerator() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>(INITIAL_FORM);
    const [isGenerating, setIsGenerating] = useState(false);
    const [letter, setLetter] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [step]);

    const updateField = (field: keyof FormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const canProceed = () => {
        if (step === 0) return form.fullName.trim() && form.program.trim() && form.university.trim();
        if (step === 1) return true;
        if (step === 2) return true;
        if (step === 3) return form.whyProgram.trim().length > 10;
        return true;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setLetter(null);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const res = await fetch("/api/practice/motivation-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ошибка генерации");
            }

            const data = await res.json();
            setLetter(data.letter);
        } catch (err: any) {
            if (err.name === "AbortError") {
                setError("Время ожидания истекло. Проверьте подключение к интернету и попробуйте ещё раз.");
            } else {
                setError(err.message || "Не удалось сгенерировать письмо");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!letter) return;
        try {
            await navigator.clipboard.writeText(letter);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = letter;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!letter) return;
        const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Motivationsschreiben_${form.university.replace(/\s+/g, "_")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setStep(0);
        setForm(INITIAL_FORM);
        setLetter(null);
        setError(null);
    };

    const LAST_FORM_STEP = 3;

    const nextStep = () => {
        if (step === LAST_FORM_STEP) {
            setStep(LAST_FORM_STEP + 1);
            handleGenerate();
        } else {
            setStep(s => Math.min(s + 1, LAST_FORM_STEP + 1));
        }
    };

    const inputClass = "w-full p-3 md:p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm md:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all";
    const labelClass = "block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2";

    return (
        <div ref={containerRef} className="max-w-4xl mx-auto w-full scroll-mt-20 px-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                            Мотивационное письмо
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            ИИ напишет профессиональное Motivationsschreiben
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-0.5 sm:gap-1 mb-8 overflow-x-auto pb-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = step === i;
                    const isDone = step > i;
                    return (
                        <div key={s.id} className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
                            <button
                                onClick={() => { if (isDone && !isGenerating) setStep(i); }}
                                disabled={!isDone || isGenerating}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap w-full justify-center
                                    ${isActive
                                        ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-sm"
                                        : isDone
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100"
                                            : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400"
                                    }`}
                            >
                                {isDone ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {i < STEPS.length - 1 && (
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-300 dark:text-zinc-700 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 md:p-8 shadow-xl min-h-[400px]">
                <AnimatePresence mode="wait">

                    {/* ── Step 0: Personal Info ── */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex flex-col gap-5"
                        >
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-violet-500" />
                                Личные данные
                            </h3>

                            {/* Language selector */}
                            <div>
                                <label className={labelClass}>Язык письма *</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateField("language", "de")}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${form.language === "de"
                                            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            }`}
                                    >
                                        🇩🇪 Deutsch
                                    </button>
                                    <button
                                        onClick={() => updateField("language", "en")}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${form.language === "en"
                                            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            }`}
                                    >
                                        🇬🇧 English
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Полное имя *</label>
                                    <input
                                        className={inputClass}
                                        placeholder="Иван Иванов"
                                        value={form.fullName}
                                        onChange={e => updateField("fullName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Дата рождения</label>
                                    <input
                                        className={inputClass}
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={e => updateField("dateOfBirth", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Страна / Город</label>
                                    <input
                                        className={inputClass}
                                        placeholder="Ташкент, Узбекистан"
                                        value={form.country}
                                        onChange={e => updateField("country", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Текущее образование</label>
                                    <input
                                        className={inputClass}
                                        placeholder="Studienkolleg TU München / Лицей №5"
                                        value={form.currentEducation}
                                        onChange={e => updateField("currentEducation", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Владение языками</label>
                                <input
                                    className={inputClass}
                                    placeholder="Русский (родной), Немецкий (B2/C1), Английский (B2)"
                                    value={form.languages}
                                    onChange={e => updateField("languages", e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 1: Academic Background ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex flex-col gap-5"
                        >
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-violet-500" />
                                Образование и цель
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Целевой ВУЗ *</label>
                                    <input
                                        className={inputClass}
                                        placeholder="TU München, RWTH Aachen..."
                                        value={form.university}
                                        onChange={e => updateField("university", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Программа обучения *</label>
                                    <select
                                        className={inputClass}
                                        value={form.program}
                                        onChange={e => updateField("program", e.target.value)}
                                    >
                                        <option value="">Выберите программу...</option>
                                        {PROGRAMS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Уровень</label>
                                    <select
                                        className={inputClass}
                                        value={form.degree}
                                        onChange={e => updateField("degree", e.target.value)}
                                    >
                                        <option value="Bachelor">Bachelor</option>
                                        <option value="Master">Master</option>
                                        <option value="Studienkolleg">Studienkolleg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Семестр начала</label>
                                    <select
                                        className={inputClass}
                                        value={form.semester}
                                        onChange={e => updateField("semester", e.target.value)}
                                    >
                                        <option value="">Выберите...</option>
                                        {SEMESTERS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Средний балл (GPA)</label>
                                    <input
                                        className={inputClass}
                                        placeholder="4.5/5.0 или 1.8"
                                        value={form.gpa}
                                        onChange={e => updateField("gpa", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Сильные предметы</label>
                                <input
                                    className={inputClass}
                                    placeholder="Математика, Физика, Информатика, Немецкий"
                                    value={form.strongSubjects}
                                    onChange={e => updateField("strongSubjects", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Олимпиады, конкурсы, сертификаты</label>
                                <textarea
                                    className={inputClass + " min-h-[90px] resize-none"}
                                    placeholder="Призёр республиканской олимпиады по математике, сертификат TestDaF C1, участие в Hackathon..."
                                    value={form.achievements}
                                    onChange={e => updateField("achievements", e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 2: Experience & Skills ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex flex-col gap-5"
                        >
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-violet-500" />
                                Опыт и навыки
                            </h3>
                            <p className="text-sm text-zinc-500 -mt-2">
                                Чем больше деталей, тем более убедительным будет письмо.
                            </p>

                            <div>
                                <label className={labelClass}>Опыт работы / стажировки / проекты</label>
                                <textarea
                                    className={inputClass + " min-h-[100px] resize-none"}
                                    placeholder="Стажировка в IT-компании (3 месяца), разработка мобильного приложения, волонтёрство в благотворительной организации..."
                                    value={form.workExperience}
                                    onChange={e => updateField("workExperience", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Личные качества и soft skills</label>
                                <input
                                    className={inputClass}
                                    placeholder="Командная работа, лидерство, аналитическое мышление, ответственность"
                                    value={form.softSkills}
                                    onChange={e => updateField("softSkills", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Хобби и внеучебная деятельность</label>
                                <textarea
                                    className={inputClass + " min-h-[80px] resize-none"}
                                    placeholder="Программирование, шахматы, волонтёрство, фотография, капитан школьной футбольной команды..."
                                    value={form.hobbies}
                                    onChange={e => updateField("hobbies", e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 3: Motivation ── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex flex-col gap-5"
                        >
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-violet-500" />
                                Мотивация и Цели
                            </h3>

                            <div>
                                <label className={labelClass}>
                                    Почему именно эта специальность? *
                                    <span className="text-zinc-300 dark:text-zinc-600 ml-2 normal-case tracking-normal font-medium">
                                        ({form.whyProgram.trim().length > 0 ? form.whyProgram.trim().split(/\s+/).length : 0} слов)
                                    </span>
                                </label>
                                <textarea
                                    className={inputClass + " min-h-[100px] resize-none"}
                                    placeholder="Что вдохновило вас выбрать эту сферу? Какой конкретный опыт, событие или проект подтолкнул вас к этому выбору?"
                                    value={form.whyProgram}
                                    onChange={e => updateField("whyProgram", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Почему этот ВУЗ / страна?</label>
                                <textarea
                                    className={inputClass + " min-h-[80px] resize-none"}
                                    placeholder="Конкретные причины: лаборатории, рейтинг программы, конкретный профессор, партнёрские компании, город..."
                                    value={form.whyCountry}
                                    onChange={e => updateField("whyCountry", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Карьерные цели (5-10 лет после окончания)</label>
                                <textarea
                                    className={inputClass + " min-h-[80px] resize-none"}
                                    placeholder="В какой компании / сфере хотите работать? Какую должность мечтаете занять? Хотите вернуться на родину или остаться?"
                                    value={form.careerGoals}
                                    onChange={e => updateField("careerGoals", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Дополнительная информация</label>
                                <input
                                    className={inputClass}
                                    placeholder="Особые обстоятельства, семейная связь с профессией, личные истории..."
                                    value={form.additionalInfo}
                                    onChange={e => updateField("additionalInfo", e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 4: Result ── */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex flex-col gap-5"
                        >
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center animate-pulse">
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </div>
                                        <Loader2 className="w-6 h-6 text-violet-500 animate-spin absolute -bottom-1 -right-1" />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-500 animate-pulse text-center">
                                        ИИ пишет ваше мотивационное письмо на {form.language === "en" ? "английском" : "немецком"} языке...
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        Это может занять 10-20 секунд
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                    <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-7 h-7 text-rose-500" />
                                    </div>
                                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 max-w-md">{error}</p>
                                    <button
                                        onClick={handleGenerate}
                                        className="text-sm font-bold text-violet-600 hover:text-violet-800 underline"
                                    >
                                        Попробовать ещё раз
                                    </button>
                                </div>
                            ) : letter ? (
                                <>
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-violet-500" />
                                            Ваше мотивационное письмо ({form.language === "en" ? "English" : "Deutsch"})
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-1.5 px-3 py-2.5 bg-violet-100 dark:bg-violet-500/10 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 active:scale-95 transition-all"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                {copied ? "Скопировано!" : "Копировать"}
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Скачать .txt
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 active:scale-95 transition-all"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Заново
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 md:p-8 shadow-inner overflow-x-hidden">
                                        <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-zinc-800 dark:text-zinc-200 break-words">
                                            {letter}
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-widest mb-1">Совет</p>
                                            <p className="text-sm text-amber-900 dark:text-amber-100">
                                                Используйте это письмо как основу. Обязательно перечитайте, добавьте личные детали и проверьте с носителем языка или репетитором перед отправкой.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            {step <= LAST_FORM_STEP && (
                <div className="flex items-center justify-between mt-6 gap-3 pb-[env(safe-area-inset-bottom)]">
                    <button
                        onClick={() => setStep(s => Math.max(s - 1, 0))}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-4 sm:px-5 py-3.5 rounded-2xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                    </button>
                    <button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {step === LAST_FORM_STEP ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">Сгенерировать письмо</span>
                                <span className="sm:hidden">Генерировать</span>
                            </>
                        ) : (
                            <>
                                Далее
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Bottom reset when done */}
            {step === LAST_FORM_STEP + 1 && letter && (
                <div className="flex justify-center mt-6 pb-[env(safe-area-inset-bottom)]">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Создать новое письмо
                    </button>
                </div>
            )}
        </div>
    );
}
