import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session && (session.user as any).role === "ADMIN";
}

// Self-heal: add hidden column if it doesn't exist yet
async function ensureHiddenCol() {
    await prisma.$executeRawUnsafe(
        `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
    ).catch(() => {});
}

// PATCH /api/admin/movies/[id] — toggle visibility { hidden: boolean }
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await isAdmin()) return new NextResponse("Forbidden", { status: 403 });
    try {
        await ensureHiddenCol();
        const { id } = await params;
        const { hidden } = await req.json();
        await prisma.$executeRawUnsafe(
            `UPDATE movie SET hidden = $1 WHERE id = $2`,
            !!hidden, id
        );
        return NextResponse.json({ ok: true, hidden: !!hidden });
    } catch (err) {
        console.error("[PATCH movie visibility]", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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
                trailerUrl: body.trailerUrl || null,
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
