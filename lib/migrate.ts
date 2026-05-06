/**
 * Self-healing DB migrations — safe to call multiple times.
 * Adds columns that exist in the Prisma schema but may be missing
 * from the production database (Neon/Vercel deploy without prisma migrate).
 */
import prisma from "@/lib/prisma";

let ran = false;

export async function ensureMigrations() {
    if (ran) return;
    ran = true;
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "trailerUrl" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0`);

        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "avatarGifUrl" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "themeColor" TEXT DEFAULT 'indigo'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "backgroundUrl" TEXT`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'es'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "daltonismMode" TEXT DEFAULT 'none'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "reducedMotion" BOOLEAN DEFAULT false`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "xp" INTEGER DEFAULT 0`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "lastActiveDay" TEXT`);

        // New tables
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "HiddenItem" (
                "id" TEXT NOT NULL,
                "profileId" TEXT NOT NULL,
                "movieId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "HiddenItem_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "HiddenItem_profileId_movieId_key" UNIQUE ("profileId","movieId")
            )
        `);

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

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ProfileAchievement" (
                "id" TEXT NOT NULL,
                "profileId" TEXT NOT NULL,
                "achievementId" TEXT NOT NULL,
                "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ProfileAchievement_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "ProfileAchievement_profileId_achievementId_key" UNIQUE ("profileId","achievementId")
            )
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Rating" (
                "id" TEXT NOT NULL,
                "profileId" TEXT NOT NULL,
                "movieId" TEXT,
                "episodeId" TEXT,
                "score" INTEGER NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
            )
        `);

        // UserList new columns
        await prisma.$executeRawUnsafe(`ALTER TABLE "UserList" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "UserList" ADD COLUMN IF NOT EXISTS "shareSlug" TEXT`);

    } catch (e) {
        // Silent — never crash the app due to migrations
        console.warn("[migrate] warning:", e);
    }
}
