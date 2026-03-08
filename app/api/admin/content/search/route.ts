import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const movies = await prisma.movie.findMany({
            where: {
                title: { contains: query, mode: "insensitive" }
            },
            take: 10,
            select: { id: true, title: true, type: true }
        });

        const episodes = await prisma.episode.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { movie: { title: { contains: query, mode: "insensitive" } } }
                ]
            },
            take: 10,
            include: {
                movie: { select: { title: true } }
            }
        });

        const results = [
            ...movies.map(m => ({ id: m.id, title: m.title, type: "MOVIE", sub: m.type })),
            ...episodes.map(e => ({
                id: e.id,
                title: `${e.movie.title} - ${e.seasonNumber}x${e.episodeNumber}: ${e.title}`,
                type: "EPISODE"
            }))
        ];

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
