import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ACHIEVEMENTS = [
    { code: "first_watch",      title: "Primera reproducción",     description: "Reproduce tu primer contenido",               icon: "▶️",  xp: 50  },
    { code: "watch_5",          title: "Cinéfilo",                  description: "Ve 5 títulos distintos",                      icon: "🎬",  xp: 100 },
    { code: "watch_25",         title: "Maratonista",               description: "Ve 25 títulos distintos",                     icon: "🏃",  xp: 250 },
    { code: "watch_100",        title: "Leyenda del streaming",     description: "Ve 100 títulos distintos",                    icon: "🏆",  xp: 500 },
    { code: "first_series",     title: "Seriéfilo",                 description: "Termina tu primera temporada completa",       icon: "📺",  xp: 150 },
    { code: "first_anime",      title: "Otaku iniciado",            description: "Ve tu primer anime",                         icon: "⛩️",  xp: 75  },
    { code: "streak_3",         title: "Constante",                 description: "3 días seguidos viendo contenido",            icon: "🔥",  xp: 100 },
    { code: "streak_7",         title: "Semana perfecta",          description: "7 días seguidos viendo contenido",            icon: "📅",  xp: 200 },
    { code: "streak_30",        title: "Adicto al streaming",       description: "30 días seguidos viendo contenido",           icon: "💎",  xp: 600 },
    { code: "first_rating",     title: "Crítico de cine",          description: "Valora tu primer título",                    icon: "⭐",  xp: 50  },
    { code: "rate_10",          title: "Experto en ratings",        description: "Valora 10 títulos",                          icon: "🌟",  xp: 150 },
    { code: "first_list",       title: "Curador",                   description: "Crea tu primera lista personalizada",         icon: "📋",  xp: 75  },
    { code: "share_list",       title: "Social",                    description: "Comparte una lista pública",                  icon: "🔗",  xp: 100 },
    { code: "first_hidden",     title: "Selectivo",                 description: "Oculta tu primer título",                   icon: "🙈",  xp: 25  },
    { code: "discover_random",  title: "Aventurero",               description: "Usa Sorpréndeme en Descubrir",               icon: "🎲",  xp: 50  },
    { code: "level_5",          title: "Nivel 5",                   description: "Alcanza el nivel 5",                         icon: "🥉",  xp: 300 },
    { code: "level_10",         title: "Nivel 10",                  description: "Alcanza el nivel 10",                        icon: "🥈",  xp: 500 },
    { code: "level_25",         title: "Nivel 25",                  description: "Alcanza el nivel 25",                        icon: "🥇",  xp: 1000},
    { code: "night_owl",        title: "Búho nocturno",            description: "Ve contenido después de las 00:00",          icon: "🦉",  xp: 75  },
    { code: "binge_3",          title: "Binge watcher",            description: "Ve 3 episodios seguidos",                    icon: "😵",  xp: 100 },
];

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        // Ensure Achievement table exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Achievement" (
                "id" TEXT NOT NULL,
                "code" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "icon" TEXT NOT NULL,
                "xp" INTEGER NOT NULL DEFAULT 50,
                CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "Achievement_code_key" UNIQUE ("code")
            )
        `);

        let created = 0;
        let skipped = 0;

        for (const ach of ACHIEVEMENTS) {
            try {
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "Achievement" ("id","code","title","description","icon","xp")
                    VALUES ($1,$2,$3,$4,$5,$6)
                    ON CONFLICT ("code") DO UPDATE SET
                        "title"=$3, "description"=$4, "icon"=$5, "xp"=$6
                `, crypto.randomUUID(), ach.code, ach.title, ach.description, ach.icon, ach.xp);
                created++;
            } catch {
                skipped++;
            }
        }

        return NextResponse.json({ ok: true, created, skipped, total: ACHIEVEMENTS.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }
    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Achievement" ORDER BY "xp" ASC`);
        return NextResponse.json(rows);
    } catch {
        return NextResponse.json([]);
    }
}
