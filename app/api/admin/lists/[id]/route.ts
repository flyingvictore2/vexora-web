import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.role === "ADMIN";
}

// POST /api/admin/lists/[id] — add movie { movieId }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    const { id } = await params;
    const { movieId } = await req.json();
    if (!movieId) return NextResponse.json({ error: "movieId requerido" }, { status: 400 });
    await prisma.$executeRawUnsafe(
        `INSERT INTO "FeaturedListItem" (id,"listId","movieId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        crypto.randomUUID(), id, movieId
    );
    return NextResponse.json({ ok: true });
}

// DELETE /api/admin/lists/[id] — remove movie { movieId }
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    const { id } = await params;
    const { movieId } = await req.json();
    await prisma.$executeRawUnsafe(
        `DELETE FROM "FeaturedListItem" WHERE "listId"=$1 AND "movieId"=$2`, id, movieId
    );
    return NextResponse.json({ ok: true });
}
