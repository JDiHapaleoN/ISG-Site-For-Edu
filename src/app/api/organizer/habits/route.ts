import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";

// GET — fetch all habits for current user
export async function GET() {
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

    // Parse completedDates from JSON string to array
    const parsed = habits.map(h => ({
        ...h,
        completedDates: JSON.parse(h.completedDates) as string[],
    }));

    return NextResponse.json(parsed);
}

// POST — create a habit
export async function POST(req: Request) {
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
            name,
            completedDates: "[]",
        },
    });

    return NextResponse.json({ ...habit, completedDates: [] });
}

// PATCH — toggle a date in completedDates
export async function PATCH(req: Request) {
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
}

// DELETE — delete a habit
export async function DELETE(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing habit id" }, { status: 400 });

    await prisma.organizerHabit.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
