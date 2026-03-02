import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import { TimerProvider } from "@/hooks/useTimer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
// Global styles
import "./globals.css";
import { BRAND_NAME, BRAND_DESCRIPTION } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    manifest: "/manifest.json",
    themeColor: "#6366f1",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: BRAND_NAME,
    },
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
                        <NavbarWrapper />
                        <div className="pt-16 min-h-screen flex flex-col">
                            {children}
                        </div>
                        <Toaster position="top-right" richColors theme="system" />
                    </TimerProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
