import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";

// GET — fetch all tasks for current user
export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensurePrismaUser(user);
    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tasks = await prisma.organizerTask.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
}

// POST — create a task
export async function POST(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensurePrismaUser(user);
    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { text, priority, deadline } = await req.json();

    const task = await prisma.organizerTask.create({
        data: {
            userId: dbUser.id,
            text,
            priority: priority || "medium",
            deadline: deadline ? new Date(deadline) : null,
        },
    });

    return NextResponse.json(task);
}

// PATCH — update a task (toggle completed, change priority, etc.)
export async function PATCH(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, completed, priority, deadline } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing task id" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const task = await prisma.organizerTask.update({
        where: { id },
        data: updateData,
    });

    return NextResponse.json(task);
}

// DELETE — delete a task
export async function DELETE(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing task id" }, { status: 400 });

    await prisma.organizerTask.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
