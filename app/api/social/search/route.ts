import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/social/search?q=username
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json([]);

    const users = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, email, name, username
        FROM "user"
        WHERE (username ILIKE $1 OR name ILIKE $1)
          AND email != $2
        ORDER BY username NULLS LAST
        LIMIT 10
    `, `%${q}%`, session.user.email);

    return NextResponse.json(users);
}
