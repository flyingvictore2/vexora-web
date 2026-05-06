import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Ensure all the new optional columns exist (idempotent)
async function ensureColumns() {
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "profile"
        ADD COLUMN IF NOT EXISTS "avatarGifUrl"  TEXT,
        ADD COLUMN IF NOT EXISTS "themeColor"    TEXT DEFAULT 'indigo',
        ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "language"      TEXT DEFAULT 'es',
        ADD COLUMN IF NOT EXISTS "daltonismMode" TEXT DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS "reducedMotion" BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "xp"            INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "streak"        INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lastActiveDay" TEXT
    `);
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json({});

    try {
        await ensureColumns();
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "themeColor","backgroundUrl","language","daltonismMode","reducedMotion","avatarGifUrl"
             FROM "profile" WHERE id=$1`, profileId);
        return NextResponse.json(rows[0] ?? {});
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId, themeColor, backgroundUrl, language, daltonismMode, reducedMotion, avatarGifUrl } = await req.json();
    if (!profileId) return new NextResponse("Missing profileId", { status: 400 });

    try {
        await ensureColumns();
        await prisma.$executeRawUnsafe(`
            UPDATE "profile" SET
                "themeColor"    = COALESCE($1,"themeColor"),
                "backgroundUrl" = $2,
                "language"      = COALESCE($3,"language"),
                "daltonismMode" = COALESCE($4,"daltonismMode"),
                "reducedMotion" = COALESCE($5,"reducedMotion"),
                "avatarGifUrl"  = $6,
                "updatedAt"     = $7::timestamp
            WHERE id=$8
        `, themeColor ?? null, backgroundUrl ?? null, language ?? null, daltonismMode ?? null,
           reducedMotion ?? null, avatarGifUrl ?? null, new Date().toISOString(), profileId);
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
