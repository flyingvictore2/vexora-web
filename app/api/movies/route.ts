import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get("all") === "true";

        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        // Self-heal: ensure hidden column exists
        await prisma.$executeRawUnsafe(
            `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
        ).catch(() => {});

        // Use raw SQL so the hidden filter always works regardless of Prisma client version
        const hiddenClause = isAdmin ? "" : `AND (hidden IS NULL OR hidden = false)`;
        const releaseClause = all ? "" : `AND ("releaseDate" IS NULL OR "releaseDate" <= NOW())`;

        const movies = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM movie WHERE 1=1 ${hiddenClause} ${releaseClause} ORDER BY "createdAt" DESC`
        );

        return NextResponse.json(movies.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) })));
    } catch (error) {
        console.error("GET_MOVIES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
