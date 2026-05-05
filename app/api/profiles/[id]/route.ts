import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/profiles/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Delete related records first to avoid FK constraint errors
        await prisma.$executeRawUnsafe(`DELETE FROM "watchhistory" WHERE "profileId" = $1`, params.id);
        await prisma.$executeRawUnsafe(`DELETE FROM "mylist" WHERE "profileId" = $1`, params.id);
        await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "profileId" = $1`, params.id);
        await prisma.$executeRawUnsafe(`DELETE FROM "UserListItem" WHERE "listId" IN (SELECT id FROM "UserList" WHERE "profileId" = $1)`, params.id);
        await prisma.$executeRawUnsafe(`DELETE FROM "UserList" WHERE "profileId" = $1`, params.id);
        await prisma.$executeRawUnsafe(`DELETE FROM "profile" WHERE id = $1`, params.id);
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Delete profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH /api/profiles/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { name, pin, isKid, avatarColor, avatarEmoji } = await req.json();

    try {
        const now = new Date().toISOString();
        await prisma.$executeRawUnsafe(
            `UPDATE "profile"
             SET name=$1, pin=$2, "isKid"=$3::boolean, "avatarColor"=$4, "avatarEmoji"=$5, "updatedAt"=$6::timestamp
             WHERE id=$7`,
            name,
            pin || null,
            isKid ? "true" : "false",
            avatarColor || "#6366f1",
            avatarEmoji || "😎",
            now,
            params.id
        );
        // Return plain object — avoid BigInt serialization issues from raw SELECT
        return NextResponse.json({
            id: params.id, name, pin: pin || null,
            isKid: isKid || false, avatarColor: avatarColor || "#6366f1",
            avatarEmoji: avatarEmoji || "😎",
        });
    } catch (err: any) {
        console.error("Edit profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
