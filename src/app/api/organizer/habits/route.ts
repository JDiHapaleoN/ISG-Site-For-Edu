import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";

// GET — fetch all habits for current user
export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await ensurePrismaUser(user);
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const habits = await prisma.organizerHabit.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: "asc" },
        });

        const parsed = habits.map(h => ({
            ...h,
            completedDates: JSON.parse(h.completedDates) as string[],
        }));

        return NextResponse.json(parsed);
    } catch (e: any) {
        console.error("[API] GET /organizer/habits error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// POST — create a habit
export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await ensurePrismaUser(user);
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { name } = await req.json();

        const habit = await prisma.organizerHabit.create({
            data: {
                userId: dbUser.id,
                name: name || "",
                completedDates: "[]",
            },
        });

        return NextResponse.json({ ...habit, completedDates: [] });
    } catch (e: any) {
        console.error("[API] POST /organizer/habits error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// PATCH — toggle a date in completedDates
export async function PATCH(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, date } = await req.json();
        if (!id || !date) return NextResponse.json({ error: "Missing id or date" }, { status: 400 });

        const habit = await prisma.organizerHabit.findUnique({ where: { id } });
        if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

        const dates: string[] = JSON.parse(habit.completedDates);
        const idx = dates.indexOf(date);
        if (idx >= 0) {
            dates.splice(idx, 1);
        } else {
            dates.push(date);
        }

        const updated = await prisma.organizerHabit.update({
            where: { id },
            data: { completedDates: JSON.stringify(dates) },
        });

        return NextResponse.json({ ...updated, completedDates: dates });
    } catch (e: any) {
        console.error("[API] PATCH /organizer/habits error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// DELETE — delete a habit
export async function DELETE(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing habit id" }, { status: 400 });

        await prisma.organizerHabit.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[API] DELETE /organizer/habits error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
