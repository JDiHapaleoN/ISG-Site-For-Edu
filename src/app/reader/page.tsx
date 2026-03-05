import InteractiveReader from "@/components/reader/InteractiveReader";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";
import Link from "next/link"; // Next.js fast client transition

export const metadata = {
    title: "Умный текст | Antigravity LMS",
    description: "Читайте, переводите и учите слова в контексте.",
};

const SAMPLE_TEXT_GERMAN = `Die künstliche Intelligenz hat in den letzten Jahren enorme Fortschritte gemacht. Viele Experten glauben, dass diese Technologie unsere Gesellschaft grundlegend verändern wird. Dennoch gibt es auch Bedenken hinsichtlich des Datenschutzes und der ethischen Implikationen.

Es ist wichtig, dass wir uns intensiv mit diesen Themen auseinandersetzen, um eine nachhaltige und gerechte Zukunft zu gestalten.`;

const SAMPLE_TEXT_ENGLISH = `Artificial intelligence has made enormous progress in recent years. Many experts believe that this technology will fundamentally change our society. However, there are also concerns regarding data protection and ethical implications.

It is important that we deal intensively with these topics in order to shape a sustainable and just future.`;

export default async function ReaderPage({
    searchParams,
}: {
    searchParams: { lang?: string };
}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;

    // 1. URL Param is the source of truth for the active module view
    let activeModule = searchParams.lang === "english" ? "english" : "german";
    let dbCustomText = "";
    let dbHighlights: number[] = [];

    // 2. Load custom text ONLY if the user is viewing the language they last saved text for.
    if (user) {
        await ensurePrismaUser(user);
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
        });

        // If URL lang isn't specified, default to their last saved module
        if (!searchParams.lang && dbUser?.activeReaderModule) {
            activeModule = dbUser.activeReaderModule;
        }

        // Only load their custom text if the current tab matches the language of their saved text
        if (dbUser?.activeReaderText && dbUser?.activeReaderModule === activeModule) {
            dbCustomText = dbUser.activeReaderText;
            if (dbUser.activeReaderHighlights) {
                dbHighlights = dbUser.activeReaderHighlights;
            }
        }
    }

    const module = activeModule as "english" | "german";
    const text = dbCustomText || (module === "german" ? SAMPLE_TEXT_GERMAN : SAMPLE_TEXT_ENGLISH);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
            <div className="max-w-6xl mx-auto mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Умный ридер
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-500 mt-2 max-w-2xl">
                        Нажмите на любое слово, чтобы перевести его, увидеть контекст или добавить в систему интервальных повторений (SRS).
                    </p>
                </div>

                <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0 self-start md:self-auto w-full sm:w-auto">
                    <Link
                        href="?lang=german"
                        prefetch={true}
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "german"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        Немецкий
                    </Link>
                    <Link
                        href="?lang=english"
                        prefetch={true}
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "english"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        Английский
                    </Link>
                </div>
            </div>

            {/* Use key to force unmount/remount when module changes to clear React state easily */}
            <InteractiveReader key={module} initialText={text} module={module} initialHighlights={dbHighlights} />
        </main>
    );
}
