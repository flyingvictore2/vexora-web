import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const rows = await prisma.$queryRawUnsafe<any[]>(`
            SELECT fl.id, fl.name, fl."createdAt",
                   fli."movieId", m.title AS "movieTitle",
                   m."thumbnailUrl", m.year, m.genre, m.rating, m.type
            FROM "FeaturedList" fl
            LEFT JOIN "FeaturedListItem" fli ON fli."listId" = fl.id
            LEFT JOIN movie m ON m.id = fli."movieId"
            WHERE fl.id = $1
            ORDER BY fli."createdAt" ASC
        `, id).catch(() => [] as any[]);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "not_found" }, { status: 404 });
        }

        const list = {
            id: rows[0].id,
            name: rows[0].name,
            createdAt: rows[0].createdAt,
            items: rows
                .filter(r => r.movieId)
                .map(r => ({
                    movieId: r.movieId,
                    movie: {
                        id: r.movieId,
                        title: r.movieTitle,
                        thumbnailUrl: r.thumbnailUrl,
                        year: r.year,
                        genre: r.genre,
                        rating: r.rating,
                        type: r.type,
                    }
                })),
        };

        return NextResponse.json(list);
    } catch {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
}
