import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/lists/[id] — eliminar lista
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.userList.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

// POST /api/lists/[id] — añadir película a lista
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { movieId } = await req.json();
    if (!movieId) return NextResponse.json({ error: "movieId requerido" }, { status: 400 });

    try {
        const item = await prisma.userListItem.create({
            data: { id: crypto.randomUUID(), listId: id, movieId },
        });
        return NextResponse.json(item);
    } catch {
        return NextResponse.json({ error: "Ya está en la lista" }, { status: 409 });
    }
}

// PATCH /api/lists/[id] — quitar película de lista
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { movieId } = await req.json();
    await prisma.userListItem.deleteMany({ where: { listId: id, movieId } });
    return NextResponse.json({ success: true });
}
