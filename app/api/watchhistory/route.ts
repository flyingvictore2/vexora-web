import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/watchhistory?profileId=xxx
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json([]);

    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT w."movieId", w.progress, w."updatedAt",
                   m.id, m.title, m."thumbnailUrl", m.type, m.genre,
                   m.rating, m.year, m."requiredPlan", m.description,
                   m."videoUrl", m.duration
            FROM "watchhistory" w
            JOIN "movie" m ON m.id = w."movieId"
            WHERE w."profileId" = $1
              AND (m.hidden IS NULL OR m.hidden = false)
            ORDER BY w."updatedAt" DESC
            LIMIT 50
        `, profileId);

        const result = rows.map(r => ({
            movieId: String(r.movieId ?? r.id),
            progress: Number(r.progress),
            updatedAt: r.updatedAt?.toISOString?.() || String(r.updatedAt),
            id: String(r.id ?? r.movieId),
            title: r.title,
            thumbnailUrl: r.thumbnailUrl,
            type: r.type,
            genre: r.genre,
            rating: r.rating,
            year: Number(r.year),
            requiredPlan: r.requiredPlan,
            description: r.description || "",
            videoUrl: r.videoUrl || "",
            duration: r.duration || "",
        }));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("Get watchhistory error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/watchhistory  { profileId, movieId, progress }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId, movieId, progress } = await req.json();
    if (!profileId || !movieId) return new NextResponse("Missing fields", { status: 400 });

    const progressVal = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));

    try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await prisma.$executeRawUnsafe(`
            INSERT INTO "watchhistory" (id, "profileId", "movieId", progress, "updatedAt")
            VALUES ($1, $2, $3, $4, $5::timestamp)
            ON CONFLICT ("profileId", "movieId")
            DO UPDATE SET progress = GREATEST("watchhistory".progress, $4), "updatedAt" = $5::timestamp
        `, id, profileId, movieId, progressVal, now);

        // Increment movie views
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0`
        ).catch(() => {});
        if (progressVal === 100) {
            await prisma.$executeRawUnsafe(
                `UPDATE "movie" SET "views" = COALESCE("views", 0) + 1 WHERE id = $1`,
                movieId
            ).catch(() => {});
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Save watchhistory error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
