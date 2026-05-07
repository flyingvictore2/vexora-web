/**
 * GET /api/debug
 * Diagnostic endpoint: checks DB columns, runs pending migrations,
 * tests session validity.  Safe to call multiple times.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const results: Record<string, any> = {};

    // 1. DB connection
    try {
        await prisma.$queryRawUnsafe("SELECT 1");
        results.db = "✅ connected";
    } catch (e: any) {
        results.db = `❌ ${e.message}`;
    }

    // 2. Check & add username column on user table
    try {
        const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'username'
        `);
        if (cols.length === 0) {
            await prisma.$executeRawUnsafe(
                `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" TEXT`
            );
            await prisma.$executeRawUnsafe(
                `CREATE UNIQUE INDEX IF NOT EXISTS "user_username_key" ON "user"("username")`
            ).catch(() => {});
            results.username_col = "🔧 added now";
        } else {
            results.username_col = "✅ exists";
        }
    } catch (e: any) {
        results.username_col = `❌ ${e.message}`;
    }

    // 3. Check profile avatar columns
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "avatarColor" TEXT`).catch(() => {});
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "avatarEmoji" TEXT`).catch(() => {});
        results.profile_cols = "✅ ok";
    } catch (e: any) {
        results.profile_cols = `❌ ${e.message}`;
    }

    // 4. Session check
    try {
        const session = await getServerSession(authOptions);
        results.session = session?.user?.email
            ? `✅ logged in as ${session.user.email}`
            : "⚠️ not logged in (visit this URL while signed in for full test)";
        results.session_raw = session?.user ?? null;
    } catch (e: any) {
        results.session = `❌ ${e.message}`;
    }

    // 5. Try fetching user from DB (requires being logged in)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const rows = await prisma.$queryRawUnsafe<{ id: string; username: string | null }[]>(
                `SELECT id, username FROM "user" WHERE email = $1 LIMIT 1`,
                session.user.email
            );
            results.user_record = rows.length ? `✅ id=${rows[0].id} username=${rows[0].username}` : "❌ not found in DB";
        } else {
            results.user_record = "skipped (not logged in)";
        }
    } catch (e: any) {
        results.user_record = `❌ ${e.message}`;
    }

    // 6. Quick profile INSERT test (dry run — rolls back)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const testId = "debug-test-" + Date.now();
            const userRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
                `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, session.user.email
            );
            if (userRows.length) {
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "profile" (id, name, pin, "avatarColor", "avatarEmoji", "userId", "createdAt", "updatedAt")
                    VALUES ($1, 'debug-test', null, '#6366f1', '😎', $2, NOW(), NOW())
                `, testId, userRows[0].id);
                await prisma.$executeRawUnsafe(`DELETE FROM "profile" WHERE id = $1`, testId);
                results.profile_insert_test = "✅ INSERT + DELETE success";
            } else {
                results.profile_insert_test = "skipped (no user record)";
            }
        } else {
            results.profile_insert_test = "skipped (not logged in)";
        }
    } catch (e: any) {
        results.profile_insert_test = `❌ ${e.message}`;
    }

    // 7. Movie type distribution — helps diagnose missing rows on home page
    try {
        const rows = await prisma.$queryRawUnsafe<{ type: string; count: string }[]>(
            `SELECT type, COUNT(*)::text AS count FROM "movie" GROUP BY type ORDER BY type`
        );
        results.movie_types = rows.length
            ? rows.map(r => `${r.type}: ${r.count}`).join(" | ")
            : "⚠️ no movies in DB";

        const now = new Date();
        const titles = await prisma.$queryRawUnsafe<{ id: string; title: string; type: string; releaseDate: Date | null }[]>(
            `SELECT id, title, type, "releaseDate" FROM "movie" ORDER BY "createdAt" DESC LIMIT 30`
        );
        results.movies_detail = titles.map(t => {
            const future = t.releaseDate && t.releaseDate > now;
            return `[${t.type}${future ? " ⏰FUTURO" : ""}] ${t.title}`;
        });

        // Specifically call out anything that looks like a series but has wrong type
        const wrongType = titles.filter(t => t.type !== "SERIE" && t.type !== "ANIME" && t.type !== "MOVIE" && t.type !== "DOCUMENTAL");
        results.wrong_types = wrongType.length ? wrongType.map(t => `id=${t.id} type="${t.type}" title="${t.title}"`) : "✅ all types look valid";

        // Direct fix helper: list SERIE items and whether they'd appear on home
        const serieItems = titles.filter(t => t.type === "SERIE");
        results.series_in_db = serieItems.length
            ? serieItems.map(t => {
                const future = t.releaseDate && t.releaseDate > now;
                return `"${t.title}" → ${future ? "❌ OCULTA por releaseDate futura" : "✅ debería aparecer en inicio"}`;
            })
            : "❌ NINGUNA — Ningún contenido tiene type=SERIE en la BD";
    } catch (e: any) {
        results.movie_types = `❌ ${e.message}`;
    }

    return NextResponse.json({ timestamp: new Date().toISOString(), ...results }, { status: 200 });
}
