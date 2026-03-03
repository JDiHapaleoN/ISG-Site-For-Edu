import ShadowingPlayer, { TranscriptSegment } from "@/components/shadowing/ShadowingPlayer";

export const metadata = {
    title: "Shadowing Player | Antigravity LMS",
    description: "Practice your pronunciation and intonation.",
};

// Dummy English transcript
const ENGLISH_TRANSCRIPT: TranscriptSegment[] = [
    { id: "s1", start: 0, end: 5, text: "Artificial intelligence has made enormous progress in recent years." },
    { id: "s2", start: 5, end: 10, text: "Many experts believe that this technology will fundamentally change our society." },
    { id: "s3", start: 10, end: 15, text: "However, there are also concerns regarding data protection and ethical implications." },
    { id: "s4", start: 15, end: 22, text: "It is important that we deal intensively with these topics in order to shape a sustainable and just future." }
];

// Dummy German transcript
const GERMAN_TRANSCRIPT: TranscriptSegment[] = [
    { id: "s1", start: 0, end: 5, text: "Die künstliche Intelligenz hat in den letzten Jahren enorme Fortschritte gemacht." },
    { id: "s2", start: 5, end: 10, text: "Viele Experten glauben, dass diese Technologie unsere Gesellschaft grundlegend verändern wird." },
    { id: "s3", start: 10, end: 15, text: "Dennoch gibt es auch Bedenken hinsichtlich des Datenschutzes und der ethischen Implikationen." },
    { id: "s4", start: 15, end: 22, text: "Es ist wichtig, dass wir uns intensiv mit diesen Themen auseinandersetzen, um eine nachhaltige und gerechte Zukunft zu gestalten." }
];

// For the demo, we use a public domain music file since we don't have speech audio hosted.
// The timestamps above are just mapped to 0-22 seconds of this track.
const AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export default function ShadowingPage({
    searchParams,
}: {
    searchParams: { lang?: string };
}) {
    const module = searchParams.lang === "german" ? "german" : "english";
    const transcript = module === "german" ? GERMAN_TRANSCRIPT : ENGLISH_TRANSCRIPT;

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
            <div className="max-w-6xl mx-auto mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        Shadowing Studio
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded outline outline-1 outline-indigo-500 text-indigo-500">BETA</span>
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-500 mt-2 max-w-2xl">
                        Listen to the audio and repeat out loud. The active sentence will be highlighted automatically. Click on any word to translate it in context. Use A/B looping to practice specific phrases.
                    </p>
                </div>

                {/* Gateway toggle for demo purposes */}
                <div className="flex gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0 self-start md:self-auto w-full sm:w-auto">
                    <a
                        href="?lang=german"
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "german"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        German
                    </a>
                    <a
                        href="?lang=english"
                        className={`flex-1 text-center sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition ${module === "english"
                            ? "bg-white dark:bg-zinc-700 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                    >
                        English
                    </a>
                </div>
            </div>

            <ShadowingPlayer module={module} audioUrl={AUDIO_URL} transcript={transcript} />
        </main>
    );
}
