import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { profile: true }
    });

    return NextResponse.json(user?.profile || []);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const profile = await prisma.profile.create({
        data: {
            id: crypto.randomUUID(),
            name,
            userId: user.id,
            image: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png", // Default image
            updatedAt: new Date()
        }
    });

    return NextResponse.json(profile);
}
