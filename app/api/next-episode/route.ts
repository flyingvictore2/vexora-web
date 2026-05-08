import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/next-episode?profileId=X
// Returns the next unseen episode for each series the profile has started.
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json([]);

    try {
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

        // Series the user has started — exclude hidden
        const startedSeries = await prisma.$queryRawUnsafe<any[]>(`
            SELECT DISTINCT m.id, m.title, m."thumbnailUrl", m.type, m.genre
            FROM "watchhistory" w
            JOIN "movie" m ON m.id = w."movieId"
            WHERE w."profileId" = $1
              AND m.type IN ('SERIE', 'ANIME')
              AND (m.hidden IS NULL OR m.hidden = false)
            ORDER BY m.id
            LIMIT 20
        `, profileId);

        const result: any[] = [];

        for (const s of startedSeries) {
            // Get all episodes ordered, find first one not in EpisodeWatch (watched=true)
            const eps = await prisma.$queryRawUnsafe<any[]>(`
                SELECT e.id, e.title, e."seasonNumber", e."episodeNumber", e."thumbnailUrl"
                FROM "episode" e
                WHERE e."movieId" = $1
                ORDER BY e."seasonNumber" ASC, e."episodeNumber" ASC
            `, s.id);

            const watched = await prisma.$queryRawUnsafe<any[]>(`
                SELECT "episodeId" FROM "EpisodeWatch" WHERE "profileId" = $1 AND watched = TRUE
            `, profileId);
            const watchedSet = new Set(watched.map(w => String(w.episodeId)));

            const next = eps.find(e => !watchedSet.has(String(e.id)));
            if (next) {
                result.push({
                    seriesId: String(s.id),
                    seriesTitle: s.title,
                    seriesThumbnail: s.thumbnailUrl,
                    type: s.type,
                    episode: {
                        id: String(next.id),
                        title: next.title,
                        seasonNumber: Number(next.seasonNumber),
                        episodeNumber: Number(next.episodeNumber),
                        thumbnailUrl: next.thumbnailUrl,
                    },
                });
            }
        }

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
