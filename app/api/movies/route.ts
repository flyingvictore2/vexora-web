import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get("all") === "true";

        await prisma.$executeRawUnsafe(
            `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
        ).catch(() => {});

        const releaseClause = all ? "" : `AND ("releaseDate" IS NULL OR "releaseDate" <= NOW())`;

        const movies = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM movie WHERE (hidden IS NULL OR hidden = false) ${releaseClause} ORDER BY "createdAt" DESC`
        );

        return NextResponse.json(movies.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) })));
    } catch (error) {
        console.error("GET_MOVIES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
