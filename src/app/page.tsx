import DashboardHub from "@/components/dashboard/DashboardHub";

export const metadata = {
    title: "Dashboard | Antigravity LMS",
    description: "Your personalized learning dashboard.",
};

export default function Home() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col pt-12">
            <DashboardHub />
        </main>
    );
}
