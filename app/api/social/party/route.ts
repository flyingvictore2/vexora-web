import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ensureTables() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WatchParty" (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            "hostProfileId" TEXT NOT NULL,
            "movieId" TEXT,
            "episodeId" TEXT,
            "currentTime" FLOAT DEFAULT 0,
            "isPlaying" BOOLEAN DEFAULT FALSE,
            "stateAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "createdAt" TIMESTAMP DEFAULT NOW()
        )
    `).catch(() => {});
    // Add stateAt column if upgrading from old schema
    await prisma.$executeRawUnsafe(
        `ALTER TABLE "WatchParty" ADD COLUMN IF NOT EXISTS "stateAt" TIMESTAMP DEFAULT NOW()`
    ).catch(() => {});
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WatchPartyMember" (
            id TEXT PRIMARY KEY,
            "partyId" TEXT NOT NULL,
            "profileId" TEXT NOT NULL,
            "lastSeen" TIMESTAMP DEFAULT NOW(),
            "joinedAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("partyId","profileId")
        )
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PartyMessage" (
            id TEXT PRIMARY KEY,
            "partyId" TEXT NOT NULL,
            "profileId" TEXT NOT NULL,
            content TEXT NOT NULL,
            "createdAt" TIMESTAMP DEFAULT NOW()
        )
    `).catch(() => {});
}

// GET /api/social/party?code=XXX
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTables();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Falta el código" }, { status: 400 });

    const parties = await prisma.$queryRawUnsafe<any[]>(`
        SELECT wp.*,
            EXTRACT(EPOCH FROM wp."stateAt") * 1000 AS "stateAtMs",
            m.title AS "movieTitle", m."thumbnailUrl" AS "movieThumbnail",
            m."videoUrl" AS "movieVideoUrl",
            ep.title AS "episodeTitle", ep."videoUrl" AS "episodeVideoUrl",
            ep."seasonNumber", ep."episodeNumber"
        FROM "WatchParty" wp
        LEFT JOIN "movie" m ON m.id=wp."movieId"
        LEFT JOIN "episode" ep ON ep.id=wp."episodeId"
        WHERE wp.code=$1
    `, code);
    if (!parties.length) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });

    const party = parties[0];

    const members = await prisma.$queryRawUnsafe<any[]>(`
        SELECT wpm."profileId", p.name AS "profileName"
        FROM "WatchPartyMember" wpm
        JOIN "profile" p ON p.id=wpm."profileId"
        WHERE wpm."partyId"=$1 AND wpm."lastSeen" > NOW() - INTERVAL '30 seconds'
    `, party.id);

    const messages = await prisma.$queryRawUnsafe<any[]>(`
        SELECT pm.*, p.name AS "profileName"
        FROM "PartyMessage" pm
        JOIN "profile" p ON p.id=pm."profileId"
        WHERE pm."partyId"=$1
        ORDER BY pm."createdAt" ASC
        LIMIT 100
    `, party.id);

    // Server time for lag compensation
    const serverNow = await prisma.$queryRawUnsafe<{ now: Date }[]>(`SELECT NOW() AS now`);
    const serverMs = new Date(serverNow[0].now).getTime();

    return NextResponse.json({ party, members, messages, serverMs });
}

// POST /api/social/party — create { profileId, movieId?, episodeId? }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTables();

    const { profileId, movieId, episodeId } = await req.json();
    if (!profileId) return NextResponse.json({ error: "Falta profileId" }, { status: 400 });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = crypto.randomUUID();

    await prisma.$executeRawUnsafe(`
        INSERT INTO "WatchParty" (id,code,"hostProfileId","movieId","episodeId","currentTime","isPlaying","stateAt","createdAt","updatedAt")
        VALUES ($1,$2,$3,$4,$5,0,false,NOW(),NOW(),NOW())
    `, id, code, profileId, movieId || null, episodeId || null);

    await prisma.$executeRawUnsafe(`
        INSERT INTO "WatchPartyMember" (id,"partyId","profileId","lastSeen","joinedAt")
        VALUES ($1,$2,$3,NOW(),NOW()) ON CONFLICT ("partyId","profileId") DO UPDATE SET "lastSeen"=NOW()
    `, crypto.randomUUID(), id, profileId);

    return NextResponse.json({ ok: true, code, id });
}

// PATCH /api/social/party
// { code, profileId, currentTime?, isPlaying?, message? }
// Only host can change currentTime/isPlaying
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    await ensureTables();

    const { code, profileId, currentTime, isPlaying, message } = await req.json();
    const parties = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id,"hostProfileId" FROM "WatchParty" WHERE code=$1`, code
    );
    if (!parties.length) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
    const party = parties[0];

    // Heartbeat
    await prisma.$executeRawUnsafe(`
        INSERT INTO "WatchPartyMember" (id,"partyId","profileId","lastSeen","joinedAt")
        VALUES ($1,$2,$3,NOW(),NOW()) ON CONFLICT ("partyId","profileId") DO UPDATE SET "lastSeen"=NOW()
    `, crypto.randomUUID(), party.id, profileId);

    // ONLY host can update playback state — stateAt records exact server time for lag compensation
    if (party.hostProfileId === profileId && currentTime !== undefined && currentTime !== null) {
        await prisma.$executeRawUnsafe(`
            UPDATE "WatchParty"
            SET "currentTime"=$1, "isPlaying"=$2, "stateAt"=NOW(), "updatedAt"=NOW()
            WHERE id=$3
        `, currentTime, isPlaying ?? false, party.id);
    }

    // Chat message
    if (message?.trim()) {
        await prisma.$executeRawUnsafe(`
            INSERT INTO "PartyMessage" (id,"partyId","profileId",content,"createdAt")
            VALUES ($1,$2,$3,$4,NOW())
        `, crypto.randomUUID(), party.id, profileId, message.trim());
    }

    return NextResponse.json({ ok: true });
}
