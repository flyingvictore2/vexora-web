import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/discover?type=top|random|filter&genre=&year=&quality=&plan=&q=
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("type") || "filter";

    try {
        await prisma.$executeRawUnsafe(
            `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
        ).catch(() => {});
        await prisma.$executeRawUnsafe(`ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0`).catch(() => {});

        // Always filter hidden — admin panel has its own endpoint that shows all
        const hiddenClause = `AND (hidden IS NULL OR hidden = false)`;

        if (action === "random") {
            const rows = await prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM movie WHERE 1=1 ${hiddenClause} ORDER BY RANDOM() LIMIT 1`
            );
            return NextResponse.json(rows.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) })));
        }

        if (action === "top") {
            const movies = await prisma.$queryRawUnsafe<any[]>(`
                SELECT id, title, "thumbnailUrl", rating, year, type, genre, "views"
                FROM movie
                WHERE 1=1 ${hiddenClause}
                ORDER BY COALESCE("views", 0) DESC, rating DESC
                LIMIT 10
            `);
            return NextResponse.json(movies.map(m => ({ ...m, views: Number(m.views || 0), year: Number(m.year) })));
        }

        // Filter mode
        const conditions: string[] = [`1=1`, hiddenClause];
        const params: any[] = [];
        let idx = 1;

        const genre = searchParams.get("genre");
        const year  = searchParams.get("year");
        const plan  = searchParams.get("plan");
        const type  = searchParams.get("contentType");
        const q     = searchParams.get("q");

        if (genre) { conditions.push(`genre ILIKE $${idx++}`); params.push(`%${genre}%`); }
        if (year)  { conditions.push(`year = $${idx++}`); params.push(Number(year)); }
        if (plan)  { conditions.push(`"requiredPlan" = $${idx++}`); params.push(plan); }
        if (type)  { conditions.push(`type = $${idx++}`); params.push(type); }
        if (q)     { conditions.push(`title ILIKE $${idx++}`); params.push(`%${q}%`); }

        const sql = `SELECT * FROM movie WHERE ${conditions.join(" ")} ORDER BY "createdAt" DESC LIMIT 60`;
        const movies = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
        return NextResponse.json(movies.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) })));
    } catch (err: any) {
        console.error("[GET /api/discover]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
