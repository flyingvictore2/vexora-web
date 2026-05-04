import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/lists/[id] — eliminar lista
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id } = await params;

        // Primero borramos los items (no hay ON DELETE CASCADE en raw SQL fácilmente)
        await prisma.$executeRawUnsafe(`DELETE FROM "UserListItem" WHERE "listId" = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "UserList" WHERE id = $1`, id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[DELETE /api/lists/[id]]", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST /api/lists/[id] — añadir película a lista
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id } = await params;
        const { movieId } = await req.json();
        if (!movieId) return NextResponse.json({ error: "movieId requerido" }, { status: 400 });

        const itemId = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
            `INSERT INTO "UserListItem" (id, "listId", "movieId", "createdAt")
             VALUES ($1, $2, $3, now())
             ON CONFLICT ("listId", "movieId") DO NOTHING`,
            itemId, id, movieId
        );

        return NextResponse.json({ id: itemId, listId: id, movieId });
    } catch (err) {
        console.error("[POST /api/lists/[id]]", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PATCH /api/lists/[id] — quitar película de lista
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { id } = await params;
        const { movieId } = await req.json();

        await prisma.$executeRawUnsafe(
            `DELETE FROM "UserListItem" WHERE "listId" = $1 AND "movieId" = $2`,
            id, movieId
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PATCH /api/lists/[id]]", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
