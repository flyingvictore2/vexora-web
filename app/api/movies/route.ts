import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get("all") === "true";

        await prisma.$executeRawUnsafe(`ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`).catch(() => {});
        await prisma.$executeRawUnsafe(`ALTER TABLE movie ADD COLUMN IF NOT EXISTS "hiddenFor" TEXT DEFAULT 'all'`).catch(() => {});

        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        // Non-admin: never see hidden. Admin: see hidden-for-users but not hidden-for-all
        const visClause = isAdmin
            ? `(hidden = false OR hidden IS NULL OR (hidden = true AND "hiddenFor" = 'users'))`
            : `(hidden = false OR hidden IS NULL)`;
        const releaseClause = all ? "" : `AND ("releaseDate" IS NULL OR "releaseDate" <= NOW())`;

        const movies = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM movie WHERE ${visClause} ${releaseClause} ORDER BY "createdAt" DESC`
        );
        return NextResponse.json(movies.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) })));
    } catch (error) {
        console.error("GET_MOVIES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
