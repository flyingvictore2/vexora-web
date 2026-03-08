import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all movies
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const movies = await prisma.movie.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(movies);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST new movie
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const movie = await prisma.movie.create({
            data: {
                title: body.title,
                description: body.description,
                thumbnailUrl: body.thumbnailUrl,
                videoUrl: body.videoUrl,
                duration: body.duration,
                genre: body.genre,
                rating: body.rating,
                year: parseInt(body.year),
                type: body.type || "MOVIE",
                requiredPlan: body.requiredPlan || "FREE",
                releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
            }
        });

        // Trigger notifications for all profiles (Isolated block)
        try {
            const profiles = await prisma.profile.findMany({ select: { id: true } });

            const typeLabels: Record<string, string> = {
                MOVIE: "Nueva Película",
                SERIE: "Nueva Serie",
                ANIME: "Nuevo Anime",
                DOCUMENTAL: "Nuevo Documental"
            };
            const typeLabel = typeLabels[movie.type] || "Nuevo Contenido";

            await Promise.all(profiles.map(profile => {
                const notificationData = {
                    id: crypto.randomUUID(),
                    profileId: profile.id,
                    title: `🎬 ${typeLabel}: ${movie.title}`,
                    message: `¡Ya puedes disfrutar de ${movie.title}! Haz clic para ver los detalles.`,
                    type: "NEW_CONTENT",
                    movieId: movie.id,
                    isRead: false
                };

                // Use raw approach if model is not in client
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
        } catch (err) {
            console.error("Notification trigger suppressed error:", err);
            // We intentionally don't throw here to allow movie creation response
        }

        return NextResponse.json(movie);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE movie
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

        console.log("Deleting movie via main route, ID:", id);
        await prisma.movie.delete({
            where: { id }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Error deleting movie:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PUT movie (Edit)
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

        const movie = await prisma.movie.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                thumbnailUrl: body.thumbnailUrl,
                videoUrl: body.videoUrl,
                duration: body.duration,
                genre: body.genre,
                rating: body.rating,
                year: parseInt(body.year),
                type: body.type || "MOVIE",
                requiredPlan: body.requiredPlan || "FREE",
            }
        });

        return NextResponse.json(movie);
    } catch (error) {
        console.error("Error updating movie:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
