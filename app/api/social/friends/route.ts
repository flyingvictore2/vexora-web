import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ensureTable() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FriendRequest" (
            id TEXT PRIMARY KEY,
            "senderId" TEXT NOT NULL,
            "receiverId" TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            "createdAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("senderId","receiverId")
        )
    `).catch(() => {});
}

async function getUid(email: string) {
    const r = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "user" WHERE email=$1 LIMIT 1`, email
    );
    return r[0]?.id ?? null;
}

// GET — list friends + pending requests
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    if (!uid) return NextResponse.json({ friends: [], incoming: [], outgoing: [] });

    const friends = await prisma.$queryRawUnsafe<any[]>(`
        SELECT CASE WHEN fr."senderId"=$1 THEN fr."receiverId" ELSE fr."senderId" END AS "userId",
               u.email, u.name, u.username, fr.id AS "requestId"
        FROM "FriendRequest" fr
        JOIN "user" u ON u.id = CASE WHEN fr."senderId"=$1 THEN fr."receiverId" ELSE fr."senderId" END
        WHERE (fr."senderId"=$1 OR fr."receiverId"=$1) AND fr.status='ACCEPTED'
    `, uid);

    const incoming = await prisma.$queryRawUnsafe<any[]>(`
        SELECT fr.id, fr."senderId", fr."createdAt", u.email, u.name, u.username
        FROM "FriendRequest" fr
        JOIN "user" u ON u.id=fr."senderId"
        WHERE fr."receiverId"=$1 AND fr.status='PENDING'
        ORDER BY fr."createdAt" DESC
    `, uid);

    const outgoing = await prisma.$queryRawUnsafe<any[]>(`
        SELECT fr.id, fr."receiverId", fr."createdAt", u.email, u.name, u.username
        FROM "FriendRequest" fr
        JOIN "user" u ON u.id=fr."receiverId"
        WHERE fr."senderId"=$1 AND fr.status='PENDING'
        ORDER BY fr."createdAt" DESC
    `, uid);

    return NextResponse.json({ friends, incoming, outgoing });
}

// POST — send request { toUserId }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    if (!uid) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const { toUserId } = await req.json();
    if (!toUserId || toUserId === uid)
        return NextResponse.json({ error: "Destino inválido" }, { status: 400 });

    const existing = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, status FROM "FriendRequest"
        WHERE ("senderId"=$1 AND "receiverId"=$2) OR ("senderId"=$2 AND "receiverId"=$1)
        LIMIT 1
    `, uid, toUserId);

    if (existing.length) {
        if (existing[0].status === "ACCEPTED") return NextResponse.json({ error: "Ya sois amigos" }, { status: 400 });
        if (existing[0].status === "PENDING")  return NextResponse.json({ error: "Solicitud ya enviada" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
        INSERT INTO "FriendRequest" (id,"senderId","receiverId",status,"createdAt")
        VALUES ($1,$2,$3,'PENDING',NOW()) ON CONFLICT DO NOTHING
    `, id, uid, toUserId);

    return NextResponse.json({ ok: true });
}

// PATCH — accept/reject { requestId, action: 'accept'|'reject' }
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    const { requestId, action } = await req.json();
    const status = action === "accept" ? "ACCEPTED" : "REJECTED";
    await prisma.$executeRawUnsafe(
        `UPDATE "FriendRequest" SET status=$1 WHERE id=$2 AND "receiverId"=$3`,
        status, requestId, uid
    );
    return NextResponse.json({ ok: true });
}

// DELETE — remove friend { friendUserId }
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTable();
    const uid = await getUid(session.user.email);
    const { friendUserId } = await req.json();
    await prisma.$executeRawUnsafe(`
        DELETE FROM "FriendRequest"
        WHERE ("senderId"=$1 AND "receiverId"=$2) OR ("senderId"=$2 AND "receiverId"=$1)
    `, uid, friendUserId);
    return NextResponse.json({ ok: true });
}
