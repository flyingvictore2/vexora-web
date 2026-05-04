import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lists?profileId=xxx — obtener todas las listas del perfil
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get("profileId");
        if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

        // Raw SQL — no depende del cliente Prisma generado
        const rows = await prisma.$queryRawUnsafe<Array<{
            listId: string;
            listName: string;
            listCreatedAt: Date;
            movieId: string | null;
            movieTitle: string | null;
            movieThumbnailUrl: string | null;
            movieGenre: string | null;
            movieRating: string | null;
            movieYear: number | null;
            movieType: string | null;
            movieDuration: string | null;
            itemCreatedAt: Date | null;
        }>>(
            `SELECT
                ul.id          AS "listId",
                ul.name        AS "listName",
                ul."createdAt" AS "listCreatedAt",
                uli."movieId",
                m.title           AS "movieTitle",
                m."thumbnailUrl"  AS "movieThumbnailUrl",
                m.genre           AS "movieGenre",
                m.rating          AS "movieRating",
                m.year            AS "movieYear",
                m.type            AS "movieType",
                m.duration        AS "movieDuration",
                uli."createdAt"   AS "itemCreatedAt"
            FROM "UserList" ul
            LEFT JOIN "UserListItem" uli ON uli."listId" = ul.id
            LEFT JOIN movie           m  ON m.id = uli."movieId"
            WHERE ul."profileId" = $1
            ORDER BY ul."createdAt" ASC, uli."createdAt" DESC`,
            profileId
        );

        // Agrupar filas por lista
        const listsMap = new Map<string, {
            id: string; name: string; createdAt: Date;
            items: Array<{ movieId: string; movie: object }>;
        }>();

        for (const row of rows) {
            if (!listsMap.has(row.listId)) {
                listsMap.set(row.listId, {
                    id: row.listId,
                    name: row.listName,
                    createdAt: row.listCreatedAt,
                    items: [],
                });
            }
            if (row.movieId) {
                listsMap.get(row.listId)!.items.push({
                    movieId: row.movieId,
                    movie: {
                        id: row.movieId,
                        title: row.movieTitle,
                        thumbnailUrl: row.movieThumbnailUrl,
                        genre: row.movieGenre,
                        rating: row.movieRating,
                        year: row.movieYear,
                        type: row.movieType,
                        duration: row.movieDuration,
                    },
                });
            }
        }

        return NextResponse.json(Array.from(listsMap.values()));
    } catch (err) {
        console.error("[GET /api/lists]", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST /api/lists — crear una lista nueva
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { profileId, name } = await req.json();
        if (!profileId || !name?.trim()) {
            return NextResponse.json({ error: "profileId y name requeridos" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
            `INSERT INTO "UserList" (id, name, "profileId", "createdAt") VALUES ($1, $2, $3, now())`,
            id, name.trim(), profileId
        );

        const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; profileId: string; createdAt: Date }>>(
            `SELECT id, name, "profileId", "createdAt" FROM "UserList" WHERE id = $1`,
            id
        );

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error("[POST /api/lists]", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
