import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lists/[id]/view — view any list by ID (any logged-in user)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;

    const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
            ul.id              AS "listId",
            ul.name            AS "listName",
            ul."createdAt"     AS "listCreatedAt",
            p.name             AS "ownerName",
            uli."movieId",
            m.title            AS "movieTitle",
            m."thumbnailUrl"   AS "movieThumbnailUrl",
            m.genre            AS "movieGenre",
            m.rating           AS "movieRating",
            m.year             AS "movieYear",
            m.type             AS "movieType"
        FROM "UserList" ul
        JOIN profile p ON p.id = ul."profileId"
        LEFT JOIN "UserListItem" uli ON uli."listId" = ul.id
        LEFT JOIN movie m ON m.id = uli."movieId"
        WHERE ul.id = $1
        ORDER BY uli."createdAt" DESC
    `, id);

    if (!rows.length) return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });

    const list = {
        id: rows[0].listId,
        name: rows[0].listName,
        ownerName: rows[0].ownerName,
        createdAt: rows[0].listCreatedAt,
        items: rows
            .filter(r => r.movieId)
            .map(r => ({
                movieId: r.movieId,
                movie: {
                    id: r.movieId,
                    title: r.movieTitle,
                    thumbnailUrl: r.movieThumbnailUrl,
                    genre: r.movieGenre,
                    rating: r.movieRating,
                    year: r.movieYear,
                    type: r.movieType,
                },
            })),
    };

    return NextResponse.json(list);
}
