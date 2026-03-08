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
    const movieId = searchParams.get("movieId");
    const episodeId = searchParams.get("episodeId");

    try {
        const servers = await prisma.videoServer.findMany({
            where: {
                ...(movieId ? { movieId } : {}),
                ...(episodeId ? { episodeId } : {})
            },
            include: {
                movie: {
                    select: { title: true }
                },
                episode: {
                    select: {
                        title: true,
                        episodeNumber: true,
                        seasonNumber: true,
                        movie: { select: { title: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(servers);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, url, quality, movieId, episodeId } = body;

        if (!name || !url || !quality || (!movieId && !episodeId)) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const server = await prisma.videoServer.create({
            data: {
                name,
                url,
                quality,
                movieId: movieId || null,
                episodeId: episodeId || null
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing id", { status: 400 });
    }

    try {
        const body = await req.json();
        const { name, url, quality } = body;

        if (!name || !url || !quality) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const server = await prisma.videoServer.update({
            where: { id },
            data: {
                name,
                url,
                quality
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing id", { status: 400 });
    }

    try {
        await prisma.videoServer.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
