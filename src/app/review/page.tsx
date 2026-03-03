import SrsReview from "@/components/srs/SrsReview";
import { BrainCircuit } from "lucide-react";

export const metadata = {
    title: "SRS Review | Antigravity LMS",
    description: "SuperMemo-2 Spaced Repetition Flashcards",
};

export default function SrsPage({
    searchParams,
}: {
    searchParams: { lang?: string };
}) {
    const module = searchParams.lang === "german" ? "german" : "english";

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
            <div className="max-w-6xl mx-auto mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 shrink-0" />
                        Spaced Repetition
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-500 mt-2 max-w-2xl">
                        Review your vocabulary items before you forget them. Data is scheduled using a modified SM-2 algorithm.
                    </p>
                </div>

                {/* Gateway toggle line */}
                <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0 self-start md:self-auto w-full sm:w-auto">
                    <a
                        href="?lang=german"
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "german"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        German 🇩🇪
                    </a>
                    <a
                        href="?lang=english"
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "english"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        English 🇬🇧
                    </a>
                </div>
            </div >

            {/* Review Component */}
            < SrsReview module={module} />
        </main >
    );
}
