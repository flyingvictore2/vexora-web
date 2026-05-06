import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/ratings?movieId=X&profileId=Y
//      /api/ratings?episodeId=X&profileId=Y
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const movieId   = searchParams.get("movieId")   || null;
    const episodeId = searchParams.get("episodeId") || null;
    const profileId = searchParams.get("profileId") || null;

    const where = movieId ? { movieId } : episodeId ? { episodeId } : null;
    if (!where) return NextResponse.json({ average: null, count: 0, userScore: null });

    try {
        // Ensure table exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Rating" (
                id TEXT PRIMARY KEY,
                "profileId" TEXT NOT NULL,
                "movieId" TEXT,
                "episodeId" TEXT,
                score INTEGER NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        const rows = await prisma.$queryRawUnsafe<any[]>(
            movieId
                ? `SELECT score, "profileId" FROM "Rating" WHERE "movieId" = $1`
                : `SELECT score, "profileId" FROM "Rating" WHERE "episodeId" = $1`,
            movieId ?? episodeId
        );

        const count   = rows.length;
        const average = count > 0 ? rows.reduce((s, r) => s + Number(r.score), 0) / count : null;
        const userRow = profileId ? rows.find(r => r.profileId === profileId) : null;
        const userScore = userRow ? Number(userRow.score) : null;

        return NextResponse.json({ average: average ? Math.round(average * 10) / 10 : null, count, userScore });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/ratings  { profileId, movieId?, episodeId?, score }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId, movieId, episodeId, score } = await req.json();
    if (!profileId || (!movieId && !episodeId)) return new NextResponse("Missing fields", { status: 400 });

    const s = Math.min(5, Math.max(1, Math.round(Number(score))));

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Rating" (
                id TEXT PRIMARY KEY,
                "profileId" TEXT NOT NULL,
                "movieId" TEXT,
                "episodeId" TEXT,
                score INTEGER NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);

        const id  = crypto.randomUUID();
        const now = new Date().toISOString();

        if (movieId) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Rating" (id, "profileId", "movieId", score, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5::timestamp, $5::timestamp)
                ON CONFLICT ("profileId", "movieId")
                DO UPDATE SET score = $4, "updatedAt" = $5::timestamp
            `, id, profileId, movieId, s, now);
        } else {
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Rating" (id, "profileId", "episodeId", score, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5::timestamp, $5::timestamp)
                ON CONFLICT ("profileId", "episodeId")
                DO UPDATE SET score = $4, "updatedAt" = $5::timestamp
            `, id, profileId, episodeId, s, now);
        }

        return NextResponse.json({ ok: true, score: s });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
