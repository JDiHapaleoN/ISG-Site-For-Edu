import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser } from "@/lib/auth-sync";
import {
    organizerTaskCreateSchema,
    organizerTaskPatchSchema,
    organizerTaskDeleteSchema,
} from "@/lib/validations";

// GET — fetch all tasks for current user
export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await ensurePrismaUser(user);
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const tasks = await prisma.organizerTask.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(tasks);
    } catch (e: any) {
        console.error("[Organizer] GET /tasks error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// POST — create a task
export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await ensurePrismaUser(user);
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const parsed = organizerTaskCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { text, priority, deadline } = parsed.data;

        const task = await prisma.organizerTask.create({
            data: {
                userId: dbUser.id,
                text,
                priority,
                deadline: deadline ? new Date(deadline) : null,
            },
        });

        return NextResponse.json(task);
    } catch (e: any) {
        console.error("[Organizer] POST /tasks error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// PATCH — update a task (toggle completed, change priority, etc.)
export async function PATCH(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = organizerTaskPatchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { id, completed, priority, deadline } = parsed.data;

        const updateData: Record<string, unknown> = {};
        if (completed !== undefined) updateData.completed = completed;
        if (priority !== undefined) updateData.priority = priority;
        if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

        const task = await prisma.organizerTask.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(task);
    } catch (e: any) {
        console.error("[Organizer] PATCH /tasks error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}

// DELETE — delete a task
export async function DELETE(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = organizerTaskDeleteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await prisma.organizerTask.delete({ where: { id: parsed.data.id } });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[Organizer] DELETE /tasks error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
