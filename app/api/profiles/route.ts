import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/** Ensure avatar columns exist on the profile table */
async function ensureProfileColumns() {
    await prisma.$executeRawUnsafe(
        `ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "avatarColor" TEXT`
    ).catch(() => {});
    await prisma.$executeRawUnsafe(
        `ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "avatarEmoji" TEXT`
    ).catch(() => {});
}

/** Ensure user exists in our DB (handles OAuth users & orphaned sessions).
 *  Uses raw SQL only — no Prisma ORM — so it works regardless of schema drift. */
async function getOrCreateUserRaw(email: string, displayName?: string | null): Promise<string> {
    // Read
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, email
    );
    if (rows.length) return rows[0].id;

    // Create (uses only base columns that have always existed)
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
        INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'USER', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
    `, id, email, displayName || null);

    // Re-read (ON CONFLICT may have triggered so our $id might not be the one stored)
    const after = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, email
    );
    return after[0]?.id ?? id;
}

// ── GET /api/profiles ─────────────────────────────────────────────────────────
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    // Use raw SQL so we don't depend on Prisma including new user columns in SELECT
    const profiles = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.* FROM "profile" p
         JOIN "user" u ON u.id = p."userId"
         WHERE u.email = $1
         ORDER BY p."createdAt" ASC`,
        session.user.email
    ).catch(() => []);

    return NextResponse.json(profiles);
}

// ── POST /api/profiles ────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Sesión no válida. Recarga la página." }, { status: 401 });
    }

    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 }); }

    const { name, pin, isKid, avatarColor, avatarEmoji } = body;
    if (!name?.trim()) {
        return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    try {
        await ensureProfileColumns();

        // Get or create the user record (raw SQL — no Prisma ORM)
        const userId = await getOrCreateUserRaw(
            session.user.email,
            (session.user as any).name
        );

        const id = crypto.randomUUID();

        // INSERT with only 7 text/uuid params — no boolean parameter at all to avoid
        // driver type-coercion bugs with Neon.  isKid is handled in a separate UPDATE.
        await prisma.$executeRawUnsafe(`
            INSERT INTO "profile"
                (id, name, pin, "avatarColor", "avatarEmoji", "userId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `,
            id,
            name.trim(),
            pin || null,
            avatarColor || "#6366f1",
            avatarEmoji  || "😎",
            userId
        );

        // Set isKid with a SQL literal (not a parameter) — avoids boolean cast issues
        if (isKid === true) {
            await prisma.$executeRawUnsafe(
                `UPDATE "profile" SET "isKid" = true WHERE id = $1`, id
            );
        }

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "profile" WHERE id = $1`, id
        );
        return NextResponse.json(rows[0] || { id, name: name.trim() });

    } catch (err: any) {
        console.error("[POST /api/profiles]", err);
        return NextResponse.json({ error: err.message || "Error al crear el perfil" }, { status: 500 });
    }
}
