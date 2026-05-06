import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/profiles/[id]
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    try {
        // Delete all FK-dependent records before deleting the profile
        await prisma.$executeRawUnsafe(`DELETE FROM "watchhistory" WHERE "profileId" = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "mylist" WHERE "profileId" = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "profileId" = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "UserListItem" WHERE "listId" IN (SELECT id FROM "UserList" WHERE "profileId" = $1)`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "UserList" WHERE "profileId" = $1`, id);
        // New tables (may not exist yet — errors are swallowed)
        await prisma.$executeRawUnsafe(`DELETE FROM "HiddenItem" WHERE "profileId" = $1`, id).catch(() => {});
        await prisma.$executeRawUnsafe(`DELETE FROM "Rating" WHERE "profileId" = $1`, id).catch(() => {});
        await prisma.$executeRawUnsafe(`DELETE FROM "ProfileAchievement" WHERE "profileId" = $1`, id).catch(() => {});
        // Finally delete the profile itself
        await prisma.$executeRawUnsafe(`DELETE FROM "profile" WHERE id = $1`, id);
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Delete profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH /api/profiles/[id]
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { name, pin, isKid, avatarColor, avatarEmoji } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

    try {
        const now = new Date().toISOString();
        await prisma.$executeRawUnsafe(
            `UPDATE "profile"
             SET name=$1, pin=$2, "isKid"=$3::boolean, "avatarColor"=$4, "avatarEmoji"=$5, "updatedAt"=$6::timestamp
             WHERE id=$7`,
            name.trim(),
            pin || null,
            isKid ? "true" : "false",
            avatarColor || "#6366f1",
            avatarEmoji || "😎",
            now,
            id
        );
        return NextResponse.json({
            id,
            name: name.trim(),
            pin: pin || null,
            isKid: isKid || false,
            avatarColor: avatarColor || "#6366f1",
            avatarEmoji: avatarEmoji || "😎",
        });
    } catch (err: any) {
        console.error("Edit profile error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
