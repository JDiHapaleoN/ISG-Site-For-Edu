import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import GlobalTimer from "@/components/layout/GlobalTimer";
import { TimerProvider } from "@/hooks/useTimer";
import { ThemeProvider } from "@/components/ThemeProvider";
// Global styles
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Antigravity LMS",
    description: "Advanced Learning Management System for University Admissions",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <TimerProvider>
                        <Navbar />
                        <GlobalTimer />
                        <div className="pt-16 min-h-screen flex flex-col">
                            {children}
                        </div>
                    </TimerProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
