import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ACHIEVEMENTS = [
    { code: "first_view",     title: "¡Bienvenido!",        description: "Ver tu primer contenido",         icon: "🎬", xp: 10 },
    { code: "watched_5",      title: "Espectador casual",   description: "Ver 5 títulos",                    icon: "👁️", xp: 50 },
    { code: "watched_25",     title: "Cinéfilo",            description: "Ver 25 títulos",                   icon: "🍿", xp: 150 },
    { code: "watched_100",    title: "Maratoniano",         description: "Ver 100 títulos",                  icon: "🏃", xp: 500 },
    { code: "watched_10_anime", title: "Otaku",             description: "Ver 10 animes",                    icon: "🌸", xp: 100 },
    { code: "watched_10_serie", title: "Bingewatcher",      description: "Ver 10 series",                    icon: "📺", xp: 100 },
    { code: "rated_10",       title: "Crítico",             description: "Valorar 10 títulos",               icon: "⭐", xp: 75 },
    { code: "rated_50",       title: "Crítico veterano",    description: "Valorar 50 títulos",               icon: "🌟", xp: 250 },
    { code: "marathon_night", title: "Maratón nocturno",    description: "Ver 3 episodios seguidos",         icon: "🌙", xp: 100 },
    { code: "streak_7",       title: "Racha semanal",       description: "Ver 7 días seguidos",              icon: "🔥", xp: 200 },
    { code: "streak_30",      title: "Racha imparable",     description: "Ver 30 días seguidos",             icon: "💎", xp: 1000 },
    { code: "list_5",         title: "Coleccionista",       description: "Tener 5 títulos en tu lista",      icon: "📚", xp: 50 },
];

async function ensureAchievementsSeeded() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Achievement" (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            xp INTEGER DEFAULT 50
        )
    `);
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProfileAchievement" (
            id TEXT PRIMARY KEY,
            "profileId" TEXT NOT NULL,
            "achievementId" TEXT NOT NULL,
            "unlockedAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("profileId", "achievementId")
        )
    `);
    for (const a of ACHIEVEMENTS) {
        const id = crypto.randomUUID();
        await prisma.$executeRawUnsafe(`
            INSERT INTO "Achievement" (id, code, title, description, icon, xp)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (code) DO UPDATE SET
                title = $3, description = $4, icon = $5, xp = $6
        `, id, a.code, a.title, a.description, a.icon, a.xp);
    }
}

function levelFromXp(xp: number) {
    // 100 XP per level up, scales x1.2
    let level = 1, needed = 100, accumulated = 0;
    while (xp - accumulated >= needed) {
        accumulated += needed;
        level += 1;
        needed = Math.round(needed * 1.2);
    }
    return { level, currentXp: xp - accumulated, nextLevelXp: needed, totalXp: xp };
}

// GET /api/gamification?profileId=X
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json({});

    try {
        await ensureAchievementsSeeded();
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "profile"
            ADD COLUMN IF NOT EXISTS "xp" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "lastActiveDay" TEXT
        `);

        const prof = await prisma.$queryRawUnsafe<any[]>(`
            SELECT xp, streak, "lastActiveDay" FROM "profile" WHERE id=$1
        `, profileId);
        const xp = Number(prof[0]?.xp || 0);
        const streak = Number(prof[0]?.streak || 0);
        const lastActiveDay = prof[0]?.lastActiveDay || null;

        const allAch = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Achievement"`);
        const unlocked = await prisma.$queryRawUnsafe<any[]>(`
            SELECT a.code, pa."unlockedAt"
            FROM "ProfileAchievement" pa
            JOIN "Achievement" a ON a.id = pa."achievementId"
            WHERE pa."profileId" = $1
        `, profileId);
        const unlockedSet = new Set(unlocked.map(u => u.code));

        const achievements = allAch.map(a => ({
            code: a.code, title: a.title, description: a.description, icon: a.icon, xp: Number(a.xp),
            unlocked: unlockedSet.has(a.code),
            unlockedAt: unlocked.find(u => u.code === a.code)?.unlockedAt ?? null,
        }));

        return NextResponse.json({
            ...levelFromXp(xp),
            streak, lastActiveDay,
            achievements,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/gamification/check  { profileId }
// Recomputes achievements + streak based on current activity. Returns newly unlocked achievements.
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return new NextResponse("Missing profileId", { status: 400 });

    try {
        await ensureAchievementsSeeded();
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "profile"
            ADD COLUMN IF NOT EXISTS "xp" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "lastActiveDay" TEXT
        `);

        // Update streak
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        const prof = await prisma.$queryRawUnsafe<any[]>(`
            SELECT xp, streak, "lastActiveDay" FROM "profile" WHERE id=$1
        `, profileId);
        const lastDay = prof[0]?.lastActiveDay;
        let streak = Number(prof[0]?.streak || 0);
        if (lastDay !== today) {
            streak = lastDay === yesterday ? streak + 1 : 1;
            await prisma.$executeRawUnsafe(
                `UPDATE "profile" SET "streak" = $1, "lastActiveDay" = $2 WHERE id = $3`,
                streak, today, profileId);
        }

        // Stats
        const watchCount   = Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS c FROM "watchhistory" WHERE "profileId"=$1`, profileId))[0]?.c || 0);
        const animeCount   = Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS c FROM "watchhistory" w JOIN "movie" m ON m.id=w."movieId" WHERE w."profileId"=$1 AND m.type='ANIME'`, profileId))[0]?.c || 0);
        const serieCount   = Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS c FROM "watchhistory" w JOIN "movie" m ON m.id=w."movieId" WHERE w."profileId"=$1 AND m.type='SERIE'`, profileId))[0]?.c || 0);
        const ratingCount  = Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS c FROM "Rating" WHERE "profileId"=$1`, profileId))[0]?.c || 0);
        const listCount    = Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS c FROM "mylist" WHERE "profileId"=$1`, profileId))[0]?.c || 0);

        const checks: Record<string, boolean> = {
            first_view:        watchCount >= 1,
            watched_5:         watchCount >= 5,
            watched_25:        watchCount >= 25,
            watched_100:       watchCount >= 100,
            watched_10_anime:  animeCount >= 10,
            watched_10_serie:  serieCount >= 10,
            rated_10:          ratingCount >= 10,
            rated_50:          ratingCount >= 50,
            streak_7:          streak >= 7,
            streak_30:         streak >= 30,
            list_5:            listCount >= 5,
        };

        const unlockedNow: any[] = [];
        for (const [code, ok] of Object.entries(checks)) {
            if (!ok) continue;
            const ach = await prisma.$queryRawUnsafe<any[]>(`SELECT id, xp, title, icon FROM "Achievement" WHERE code=$1`, code);
            if (!ach[0]) continue;
            const exists = await prisma.$queryRawUnsafe<any[]>(`SELECT id FROM "ProfileAchievement" WHERE "profileId"=$1 AND "achievementId"=$2`, profileId, ach[0].id);
            if (exists.length === 0) {
                const id = crypto.randomUUID();
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "ProfileAchievement" (id, "profileId", "achievementId", "unlockedAt")
                    VALUES ($1, $2, $3, NOW())
                `, id, profileId, ach[0].id);
                await prisma.$executeRawUnsafe(`UPDATE "profile" SET xp = COALESCE(xp,0) + $1 WHERE id=$2`, Number(ach[0].xp), profileId);
                unlockedNow.push({ code, title: ach[0].title, icon: ach[0].icon, xp: Number(ach[0].xp) });
            }
        }

        return NextResponse.json({ ok: true, streak, unlockedNow });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
