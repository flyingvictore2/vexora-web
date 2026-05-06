import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ensureTable() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "HiddenItem" (
            id TEXT PRIMARY KEY,
            "profileId" TEXT NOT NULL,
            "movieId" TEXT NOT NULL,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("profileId", "movieId")
        )
    `);
}

// GET /api/hidden?profileId=X
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json([]);
    try {
        await ensureTable();
        const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT "movieId" FROM "HiddenItem" WHERE "profileId"=$1`, profileId);
        return NextResponse.json(rows.map(r => String(r.movieId)));
    } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

// POST /api/hidden  { profileId, movieId, hidden: true | false }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    const { profileId, movieId, hidden } = await req.json();
    if (!profileId || !movieId) return new NextResponse("Missing fields", { status: 400 });
    try {
        await ensureTable();
        if (hidden === false) {
            await prisma.$executeRawUnsafe(`DELETE FROM "HiddenItem" WHERE "profileId"=$1 AND "movieId"=$2`, profileId, movieId);
        } else {
            const id = crypto.randomUUID();
            await prisma.$executeRawUnsafe(`
                INSERT INTO "HiddenItem" (id, "profileId", "movieId") VALUES ($1, $2, $3)
                ON CONFLICT ("profileId", "movieId") DO NOTHING
            `, id, profileId, movieId);
        }
        return NextResponse.json({ ok: true });
    } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
