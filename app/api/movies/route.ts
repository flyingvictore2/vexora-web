import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get("all") === "true";
        const now = new Date();

        const where: any = all ? {} : {
            OR: [
                { releaseDate: null },
                { releaseDate: { lte: now } }
            ]
        };

        const movies = await prisma.movie.findMany({ where });
        return NextResponse.json(movies);
    } catch (error) {
        console.error("GET_MOVIES_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
