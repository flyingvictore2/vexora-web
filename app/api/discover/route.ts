import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/discover?type=top|random|filter&genre=&year=&quality=&plan=&q=
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("type") || "filter";

    try {
        if (action === "random") {
            const count = await prisma.movie.count();
            if (count === 0) return NextResponse.json([]);
            const skip = Math.floor(Math.random() * count);
            const movies = await prisma.movie.findMany({ skip, take: 1 });
            return NextResponse.json(movies);
        }

        if (action === "top") {
            // Top 10 by views (fallback to rating if views are 0)
            await prisma.$executeRawUnsafe(`ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0`).catch(()=>{});
            const movies = await prisma.$queryRawUnsafe<any[]>(`
                SELECT id, title, "thumbnailUrl", rating, year, type, genre, "views"
                FROM "movie"
                ORDER BY COALESCE("views", 0) DESC, rating DESC
                LIMIT 10
            `);
            return NextResponse.json(movies.map((m: any) => ({ ...m, views: Number(m.views || 0), year: Number(m.year) })));
        }

        // Filter mode
        const where: any = {};
        const genre = searchParams.get("genre");
        const year  = searchParams.get("year");
        const plan  = searchParams.get("plan");
        const type  = searchParams.get("contentType");
        const q     = searchParams.get("q");

        if (genre) where.genre = { contains: genre, mode: "insensitive" };
        if (year)  where.year = Number(year);
        if (plan)  where.requiredPlan = plan;
        if (type)  where.type = type;
        if (q)     where.title = { contains: q, mode: "insensitive" };

        const movies = await prisma.movie.findMany({
            where,
            take: 60,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(movies);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
