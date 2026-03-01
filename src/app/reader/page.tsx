import InteractiveReader from "@/components/reader/InteractiveReader";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";

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
    const { data: { user } } = await supabase.auth.getUser();

    let persistedText = "";
    let persistedModule = searchParams.lang === "english" ? "english" : "german";

    if (user) {
        await ensurePrismaUser(user);
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
        });
        if (dbUser?.activeReaderText) {
            persistedText = dbUser.activeReaderText;
            persistedModule = (dbUser.activeReaderModule as "english" | "german") || persistedModule;
        }
    }

    const module = persistedModule as "english" | "german";
    const text = persistedText || (module === "german" ? SAMPLE_TEXT_GERMAN : SAMPLE_TEXT_ENGLISH);

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Умный ридер
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        Нажмите на любое слово, чтобы перевести его, увидеть контекст или добавить в систему интервальных повторений (SRS).
                    </p>
                </div>

                <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                    <a
                        href="?lang=german"
                        className={`px-4 py-2 rounded-md font-semibold transition ${module === "german"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        Немецкий
                    </a>
                    <a
                        href="?lang=english"
                        className={`px-4 py-2 rounded-md font-semibold transition ${module === "english"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        Английский
                    </a>
                </div>
            </div>

            <InteractiveReader initialText={text} module={module} />
        </main>
    );
}
