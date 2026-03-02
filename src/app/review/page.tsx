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
            <div className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <BrainCircuit className="w-10 h-10 text-indigo-500" />
                        Spaced Repetition
                    </h1>
                    <p className="text-zinc-500 mt-2 max-w-2xl">
                        Review your vocabulary items before you forget them. Data is scheduled using a modified SM-2 algorithm.
                    </p>
                </div>

                {/* Gateway toggle line */}
                <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0">
                    <a
                        href="?lang=german"
                        className={`px-4 py-2 rounded-md font-semibold transition ${module === "german"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        German 🇩🇪
                    </a>
                    <a
                        href="?lang=english"
                        className={`px-4 py-2 rounded-md font-semibold transition ${module === "english"
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
