import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function ensureTables() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FeaturedList" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FeaturedListItem" (
            id TEXT PRIMARY KEY,
            "listId" TEXT NOT NULL REFERENCES "FeaturedList"(id) ON DELETE CASCADE,
            "movieId" TEXT NOT NULL REFERENCES movie(id) ON DELETE CASCADE,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE("listId","movieId")
        )
    `).catch(() => {});
}

async function isAdmin(req?: Request) {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.role === "ADMIN";
}

// GET — all featured lists with items
export async function GET() {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    await ensureTables();

    const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT fl.id, fl.name, fl."createdAt",
               fli."movieId", m.title AS "movieTitle", m."thumbnailUrl"
        FROM "FeaturedList" fl
        LEFT JOIN "FeaturedListItem" fli ON fli."listId" = fl.id
        LEFT JOIN movie m ON m.id = fli."movieId"
        ORDER BY fl."createdAt" DESC, fli."createdAt" ASC
    `);

    const map = new Map<string, any>();
    for (const r of rows) {
        if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name, createdAt: r.createdAt, items: [] });
        if (r.movieId) map.get(r.id).items.push({ movieId: r.movieId, title: r.movieTitle, thumbnailUrl: r.thumbnailUrl });
    }
    return NextResponse.json(Array.from(map.values()));
}

// POST — create list { name }
export async function POST(req: Request) {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    await ensureTables();
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`INSERT INTO "FeaturedList" (id,name) VALUES ($1,$2)`, id, name.trim());
    return NextResponse.json({ id, name: name.trim() });
}

// DELETE — delete list { id }
export async function DELETE(req: Request) {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    const { id } = await req.json();
    await prisma.$executeRawUnsafe(`DELETE FROM "FeaturedList" WHERE id=$1`, id);
    return NextResponse.json({ ok: true });
}
