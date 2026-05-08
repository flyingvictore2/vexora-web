import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get("all") === "true";
        const now = new Date();

        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        // Self-heal: ensure hidden column exists
        await prisma.$executeRawUnsafe(
            `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
        ).catch(() => {});

        const where: any = {
            ...(isAdmin ? {} : { hidden: false }),
            ...(all ? {} : {
                OR: [
                    { releaseDate: null },
                    { releaseDate: { lte: now } }
                ]
            }),
        };

        const movies = await prisma.movie.findMany({ where });
        return NextResponse.json(movies);
    } catch (error) {
        console.error("GET_MOVIES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
