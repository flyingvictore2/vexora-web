import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ensureProfileColumns() {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "profile"
        ADD COLUMN IF NOT EXISTS "avatarColor" TEXT,
        ADD COLUMN IF NOT EXISTS "avatarEmoji" TEXT
    `);
}

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
        await ensureProfileColumns();

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await prisma.$executeRawUnsafe(
            `INSERT INTO "profile" (id, name, pin, "isKid", "avatarColor", "avatarEmoji", "userId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4::boolean, $5, $6, $7, $8::timestamp, $9::timestamp)`,
            id,
            name,
            pin || null,
            isKid ? "true" : "false",
            avatarColor || "#6366f1",
            avatarEmoji || "😎",
            user.id,
            now,
            now
        );

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "profile" WHERE id = $1`, id
        );

        return NextResponse.json(rows[0] || { id, name });
    } catch (err: any) {
        console.error("Profile create error:", err);
        return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
    }
}
