import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET episodes for a series
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const movieId = searchParams.get("movieId");

        if (!movieId) {
            return new NextResponse("Missing Series ID", { status: 400 });
        }

        const episodes = await prisma.episode.findMany({
            where: { movieId },
            orderBy: [
                { seasonNumber: "asc" },
                { episodeNumber: "asc" }
            ]
        });

        return NextResponse.json(episodes);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST new episode
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const episode = await prisma.episode.create({
            data: {
                title: body.title,
                description: body.description,
                thumbnailUrl: body.thumbnailUrl,
                videoUrl: body.videoUrl,
                episodeNumber: parseInt(body.episodeNumber),
                seasonNumber: parseInt(body.seasonNumber),
                movieId: body.movieId,
            }
        });

        // Trigger notifications for users who have this series in their list
        try {
            const series = await prisma.movie.findUnique({
                where: { id: body.movieId },
                select: { title: true }
            });

            if (series) {
                const profilesWithSeries = await prisma.mylist.findMany({
                    where: { movieId: body.movieId },
                    select: { profileId: true }
                });

                await Promise.all(profilesWithSeries.map(p => {
                    const notificationData = {
                        id: crypto.randomUUID(),
                        profileId: p.profileId,
                        title: `📺 Nuevo Episodio: ${series.title}`,
                        message: `Se ha añadido el episodio ${episode.episodeNumber} de la temporada ${episode.seasonNumber}: ${episode.title}`,
                        type: "NEW_EPISODE",
                        movieId: body.movieId,
                        isRead: false
                    };

                    if ((prisma as any).notification) {
                        return (prisma as any).notification.create({ data: notificationData });
                    } else {
                        return prisma.$executeRawUnsafe(
                            `INSERT INTO "Notification" ("id", "profileId", "title", "message", "type", "movieId", "isRead", "createdAt") 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                            notificationData.id, notificationData.profileId, notificationData.title,
                            notificationData.message, notificationData.type, notificationData.movieId,
                            notificationData.isRead
                        );
                    }
                }));
            }
        } catch (err) {
            console.error("Episode notification trigger suppressed error:", err);
        }

        return NextResponse.json(episode);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE episode
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        await prisma.episode.delete({
            where: { id }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PUT update episode
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const body = await req.json();

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        const episode = await prisma.episode.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                thumbnailUrl: body.thumbnailUrl,
                videoUrl: body.videoUrl,
                episodeNumber: parseInt(body.episodeNumber),
                seasonNumber: parseInt(body.seasonNumber),
            }
        });

        return NextResponse.json(episode);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
