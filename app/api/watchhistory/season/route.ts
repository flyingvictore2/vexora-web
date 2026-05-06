import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/watchhistory/season  { profileId, movieId, seasonNumber, mark: true | false }
// Marks every episode of that season as watched (or unwatched).
// Episodes don't have a watchhistory row; the movie does. We just mark the parent movie as 100%.
// We also keep per-episode flags via raw SQL on a side table.
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId, movieId, seasonNumber, mark } = await req.json();
    if (!profileId || !movieId || seasonNumber === undefined) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    try {
        // Make sure the watchhistory row for the parent movie exists
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const score = mark === false ? 0 : 100;

        await prisma.$executeRawUnsafe(`
            INSERT INTO "watchhistory" (id, "profileId", "movieId", progress, "updatedAt")
            VALUES ($1, $2, $3, $4, $5::timestamp)
            ON CONFLICT ("profileId", "movieId")
            DO UPDATE SET progress = $4, "updatedAt" = $5::timestamp
        `, id, profileId, movieId, score, now);

        // Episode-level flags table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "EpisodeWatch" (
                id TEXT PRIMARY KEY,
                "profileId" TEXT NOT NULL,
                "episodeId" TEXT NOT NULL,
                watched BOOLEAN DEFAULT TRUE,
                "updatedAt" TIMESTAMP DEFAULT NOW(),
                UNIQUE("profileId", "episodeId")
            )
        `);

        const episodes = await prisma.episode.findMany({
            where: { movieId, seasonNumber: Number(seasonNumber) },
            select: { id: true },
        });

        for (const ep of episodes) {
            const eid = crypto.randomUUID();
            await prisma.$executeRawUnsafe(`
                INSERT INTO "EpisodeWatch" (id, "profileId", "episodeId", watched, "updatedAt")
                VALUES ($1, $2, $3, $4, $5::timestamp)
                ON CONFLICT ("profileId", "episodeId")
                DO UPDATE SET watched = $4, "updatedAt" = $5::timestamp
            `, eid, profileId, ep.id, mark !== false, now);
        }

        return NextResponse.json({ ok: true, count: episodes.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
