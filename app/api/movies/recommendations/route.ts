import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get("profileId");
        if (!profileId) return new NextResponse("Missing profileId", { status: 400 });

        // Always filter hidden on public site
        const hiddenClause = `AND (m.hidden IS NULL OR m.hidden = false)`;

        // Self-heal
        await prisma.$executeRawUnsafe(
            `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
        ).catch(() => {});

        // Get watch history + my list to find genres
        const [watchHistory, myList] = await Promise.all([
            prisma.watchhistory.findMany({ where: { profileId }, include: { movie: true } }),
            prisma.mylist.findMany({ where: { profileId }, include: { movie: true } }),
        ]);

        const allInteractedIds = new Set([
            ...watchHistory.map(h => h.movieId),
            ...myList.map(l => l.movieId),
        ]);

        const genres = new Set<string>();
        watchHistory.forEach(h => h.movie.genre.split(",").forEach(g => genres.add(g.trim())));
        myList.forEach(l => l.movie.genre.split(",").forEach(g => genres.add(g.trim())));

        let recommendations: any[] = [];

        if (genres.size > 0) {
            const genreConditions = Array.from(genres).map(g => `m.genre ILIKE '%${g.replace(/'/g, "''")}%'`).join(" OR ");
            const excludeIds = Array.from(allInteractedIds);
            const excludeClause = excludeIds.length > 0
                ? `AND m.id NOT IN (${excludeIds.map(id => `'${id.replace(/'/g, "''")}'`).join(",")})`
                : "";

            recommendations = await prisma.$queryRawUnsafe<any[]>(`
                SELECT m.* FROM movie m
                WHERE (${genreConditions || "1=1"})
                ${hiddenClause}
                ${excludeClause}
                AND (m."releaseDate" IS NULL OR m."releaseDate" <= NOW())
                LIMIT 10
            `);
        }

        if (recommendations.length < 5) {
            const excludeIds = new Set([...allInteractedIds, ...recommendations.map((r: any) => r.id)]);
            const excludeClause = excludeIds.size > 0
                ? `AND m.id NOT IN (${Array.from(excludeIds).map(id => `'${(id as string).replace(/'/g, "''")}'`).join(",")})`
                : "";

            const extra = await prisma.$queryRawUnsafe<any[]>(`
                SELECT m.* FROM movie m
                WHERE 1=1
                ${hiddenClause}
                ${excludeClause}
                AND (m."releaseDate" IS NULL OR m."releaseDate" <= NOW())
                ORDER BY m.rating DESC
                LIMIT ${10 - recommendations.length}
            `);
            recommendations = [...recommendations, ...extra];
        }

        recommendations = recommendations
            .sort(() => Math.random() - 0.5)
            .map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) }));

        return NextResponse.json(recommendations);
    } catch (error) {
        console.error("RECOMMENDATIONS_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
