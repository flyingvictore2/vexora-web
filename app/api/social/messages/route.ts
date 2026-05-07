import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ensureTable() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DirectMessage" (
            id TEXT PRIMARY KEY,
            "senderUserId" TEXT NOT NULL,
            "receiverUserId" TEXT NOT NULL,
            content TEXT NOT NULL,
            "isRead" BOOLEAN DEFAULT FALSE,
            "createdAt" TIMESTAMP DEFAULT NOW()
        )
    `).catch(() => {});
}

async function getUid(email: string) {
    const r = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "user" WHERE email=$1 LIMIT 1`, email
    );
    return r[0]?.id ?? null;
}

// GET /api/social/messages?withUserId=X  → conversation
// GET /api/social/messages               → conversations list
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    if (!uid) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get("withUserId");

    if (withUserId) {
        const messages = await prisma.$queryRawUnsafe<any[]>(`
            SELECT dm.*, u.name AS "senderName", u.username AS "senderUsername"
            FROM "DirectMessage" dm
            JOIN "user" u ON u.id=dm."senderUserId"
            WHERE (dm."senderUserId"=$1 AND dm."receiverUserId"=$2)
               OR (dm."senderUserId"=$2 AND dm."receiverUserId"=$1)
            ORDER BY dm."createdAt" ASC
            LIMIT 200
        `, uid, withUserId);

        // Mark incoming as read
        await prisma.$executeRawUnsafe(`
            UPDATE "DirectMessage" SET "isRead"=true
            WHERE "receiverUserId"=$1 AND "senderUserId"=$2 AND "isRead"=false
        `, uid, withUserId);

        return NextResponse.json(messages);
    }

    // Conversations list — last message per peer
    const convs = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
            other_id AS "otherUserId",
            ou.name, ou.username, ou.email,
            last_msg.content AS "lastMessage",
            last_msg."createdAt" AS "lastAt",
            last_msg."senderUserId"=$1 AS "isMine",
            (SELECT COUNT(*)::int FROM "DirectMessage"
             WHERE "receiverUserId"=$1 AND "senderUserId"=other_id AND "isRead"=false) AS "unreadCount"
        FROM (
            SELECT DISTINCT ON (other_id) other_id, id, content, "createdAt", "senderUserId"
            FROM (
                SELECT CASE WHEN "senderUserId"=$1 THEN "receiverUserId" ELSE "senderUserId" END AS other_id,
                       id, content, "createdAt", "senderUserId"
                FROM "DirectMessage"
                WHERE "senderUserId"=$1 OR "receiverUserId"=$1
            ) sub
            ORDER BY other_id, "createdAt" DESC
        ) last_msg
        JOIN "user" ou ON ou.id=last_msg.other_id
        ORDER BY last_msg."createdAt" DESC
    `, uid, uid);

    return NextResponse.json(convs);
}

// POST /api/social/messages { toUserId, content }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    if (!uid) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const { toUserId, content } = await req.json();
    if (!toUserId || !content?.trim())
        return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
        INSERT INTO "DirectMessage" (id,"senderUserId","receiverUserId",content,"isRead","createdAt")
        VALUES ($1,$2,$3,$4,false,NOW())
    `, id, uid, toUserId, content.trim());

    return NextResponse.json({ ok: true, id });
}
