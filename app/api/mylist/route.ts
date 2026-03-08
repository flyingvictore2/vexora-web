import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!session || !profileId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const myList = await prisma.mylist.findMany({
        where: { profileId },
        include: { movie: true }
    });

    const movies = myList.map(item => item.movie);
    return NextResponse.json(movies);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { movieId, profileId } = await req.json();
    if (!movieId || !profileId) return new NextResponse("Bad Request", { status: 400 });

    try {
        const item = await prisma.mylist.create({
            data: { id: crypto.randomUUID(), movieId, profileId }
        });
        return NextResponse.json(item);
    } catch (error) {
        return new NextResponse("Conflict or Error", { status: 409 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId");
    const profileId = searchParams.get("profileId");

    if (!movieId || !profileId) return new NextResponse("Bad Request", { status: 400 });

    await prisma.mylist.delete({
        where: {
            profileId_movieId: { profileId, movieId }
        }
    });

    return new NextResponse("Deleted", { status: 200 });
}
