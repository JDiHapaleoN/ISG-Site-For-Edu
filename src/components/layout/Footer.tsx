"use client";

import Link from "next/link";
import { GraduationCap, Phone, MapPin, Globe, Instagram, Send } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 transition-colors mt-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2 group w-fit">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-sans font-black text-xl tracking-tighter text-zinc-900 dark:text-white">
                                {BRAND_NAME}
                            </span>
                        </Link>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                            Ваш проводник в мире образования и подготовки к международным экзаменам. 
                            Учитесь эффективно с помощью ИИ и современных методик.
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                             <a href="https://t.me/isg_study" className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-all">
                                <Send className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com/isg_study" className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:text-pink-600 transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-widest text-xs">Платформа</h4>
                        <nav className="flex flex-col gap-2.5">
                            {[
                                { name: "Главная", href: "/" },
                                { name: "Ридер", href: "/reader" },
                                { name: "Словарь SRS", href: "/review" },
                                { name: "Математика", href: "/math" },
                                { name: "Тренажеры", href: "/practice" }
                            ].map(link => (
                                <Link 
                                    key={link.name} 
                                    href={link.href} 
                                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-widest text-xs">Контакты</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <span>Онлайн-платформа</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium group">
                                <Globe className="w-4 h-4 text-indigo-500" />
                                <span>study-isg.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Regional Support - Requested Label */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-widest text-xs">Поддержка</h4>
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex flex-col gap-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Казахстан</span>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-indigo-500" />
                                <a 
                                    href="tel:+77762224466" 
                                    className="text-base font-black text-zinc-900 dark:text-white hover:text-indigo-600 transition-colors font-sans"
                                >
                                    +7 776 222 44 66
                                </a>
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase mt-1">
                                Представитель из Казахстана
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        © {currentYear} {BRAND_NAME}. Все права защищены.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-widest transition-colors">
                            Политика конфиденциальности
                        </Link>
                        <Link href="/terms" className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-widest transition-colors">
                            Условия использования
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
