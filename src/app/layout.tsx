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
    icons: {
        icon: "/icons/icon-192x192.png",
        apple: "/icons/icon-192x192.png",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: BRAND_NAME,
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover" as const,
    themeColor: "#6366f1",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-x-hidden min-h-[100dvh]`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <TimerProvider>
                        <NavbarWrapper />
                        <div
                            className="min-h-[100dvh] flex flex-col w-full max-w-[100vw] overflow-x-hidden"
                            style={{
                                paddingTop: "calc(env(safe-area-inset-top) + 4rem)",
                                paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)"
                            }}
                        >
                            {children}
                        </div>
                        <Toaster position="top-center" richColors theme="system" />
                    </TimerProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
