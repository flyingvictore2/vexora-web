import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/lists/public { listId, isPublic }
// Toggles the public flag on a UserList and generates a shareSlug.
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { listId, isPublic } = await req.json();
    if (!listId) return new NextResponse("Missing listId", { status: 400 });

    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "UserList"
            ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS "shareSlug" TEXT UNIQUE
        `);

        const slug = isPublic ? Math.random().toString(36).slice(2, 10) : null;
        await prisma.$executeRawUnsafe(`
            UPDATE "UserList" SET "isPublic" = $1, "shareSlug" = $2 WHERE id = $3
        `, !!isPublic, slug, listId);

        return NextResponse.json({ ok: true, slug });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
