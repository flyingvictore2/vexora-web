import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT fl.id, fl.name, fl."createdAt",
                   fli."movieId", m.title AS "movieTitle",
                   m."thumbnailUrl", m.year, m.genre, m.rating, m.type
            FROM "FeaturedList" fl
            LEFT JOIN "FeaturedListItem" fli ON fli."listId" = fl.id
            LEFT JOIN movie m ON m.id = fli."movieId"
            ORDER BY fl."createdAt" DESC, fli."createdAt" ASC
        `).catch(() => [] as any[]);

        const map = new Map<string, any>();
        for (const r of rows) {
            if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name, createdAt: r.createdAt, items: [] });
            if (r.movieId) map.get(r.id).items.push({
                movieId: r.movieId,
                movie: { id: r.movieId, title: r.movieTitle, thumbnailUrl: r.thumbnailUrl, year: r.year, genre: r.genre, rating: r.rating, type: r.type }
            });
        }
        return NextResponse.json(Array.from(map.values()));
    } catch {
        return NextResponse.json([]);
    }
}
