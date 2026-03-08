import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { id } = await params;
        console.log("Attempting to delete movie with ID:", id);
        await prisma.movie.delete({
            where: { id: id }
        });
        console.log("Successfully deleted movie with ID:", id);
        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Error deleting movie:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const movie = await prisma.movie.update({
            where: { id: id },
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
        return NextResponse.json(movie);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
