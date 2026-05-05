import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { profile: true }
    });

    return NextResponse.json(user?.profile || []);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { name, pin, isKid, avatarColor, avatarEmoji } = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        // Use raw SQL so new columns work even if Prisma client cache is stale
        await prisma.$executeRawUnsafe(
            `INSERT INTO "profile" (id, name, pin, "isKid", "avatarColor", "avatarEmoji", "userId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            id,
            name,
            pin || null,
            isKid || false,
            avatarColor || "#6366f1",
            avatarEmoji || "😎",
            user.id,
            now,
            now
        );

        const profile = await prisma.$queryRawUnsafe(
            `SELECT * FROM "profile" WHERE id = $1`, id
        );

        return NextResponse.json(Array.isArray(profile) ? profile[0] : profile);
    } catch (err: any) {
        console.error("Profile create error:", err);
        return NextResponse.json({ error: err.message || "Error al crear el perfil" }, { status: 500 });
    }
}
