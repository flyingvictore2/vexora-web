import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Asegurar que las tablas existen (se ejecuta la primera vez si faltan)
async function ensureTables() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserList" (
            id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name        TEXT NOT NULL,
            "profileId" TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UserList_profileId_idx" ON "UserList"("profileId")
    `);
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserListItem" (
            id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "listId"    TEXT NOT NULL REFERENCES "UserList"(id) ON DELETE CASCADE,
            "movieId"   TEXT NOT NULL REFERENCES movie(id) ON DELETE CASCADE,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE("listId", "movieId")
        )
    `);
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UserListItem_listId_idx" ON "UserListItem"("listId")
    `);
}

// GET /api/lists?profileId=xxx
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get("profileId");
        if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

        await ensureTables();

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
                m.duration        AS "movieDuration"
            FROM "UserList" ul
            LEFT JOIN "UserListItem" uli ON uli."listId" = ul.id
            LEFT JOIN movie           m  ON m.id = uli."movieId"
            WHERE ul."profileId" = $1
            ORDER BY ul."createdAt" ASC, uli."createdAt" DESC`,
            profileId
        );

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
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[GET /api/lists]", msg);
        // Devolver el error real temporalmente para poder diagnosticar
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// POST /api/lists
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { profileId, name } = await req.json();
        if (!profileId || !name?.trim()) {
            return NextResponse.json({ error: "profileId y name requeridos" }, { status: 400 });
        }

        await ensureTables();

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
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[POST /api/lists]", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
