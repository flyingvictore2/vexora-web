import React from "react";
import prisma from "@/lib/prisma";
import FilterBar from "@/components/FilterBar";
import MovieGrid from "@/components/MovieGrid";
import { ensureMigrations } from "@/lib/migrate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ genre?: string; year?: string; sort?: string }>;
}

export default async function AnimesPage({ searchParams }: PageProps) {
    await ensureMigrations();
    await prisma.$executeRawUnsafe(
        `ALTER TABLE movie ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false`
    ).catch(() => {});

    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const params = await searchParams;
    const genre = params.genre || "";
    const year = params.year || "";
    const sort = params.sort || "";

    const where: Record<string, unknown> = { type: "ANIME" };
    if (!isAdmin) where.hidden = false;
    if (genre) where.genre = genre;
    if (year) where.year = parseInt(year);

    let animes = await prisma.movie.findMany({
        where,
        orderBy: sort === "oldest" ? { createdAt: "asc" } : sort === "az" ? { title: "asc" } : { createdAt: "desc" },
    });

    if (sort === "rating") {
        animes = animes.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
    }

    const allAnimes = await prisma.movie.findMany({
        where: { type: "ANIME", ...(!isAdmin ? { hidden: false } : {}) },
        select: { genre: true, year: true },
    });
    const genres = [...new Set(allAnimes.map(m => m.genre).filter(Boolean))].sort() as string[];
    const years = [...new Set(allAnimes.map(m => m.year).filter(Boolean))].sort((a, b) => b - a) as number[];

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "800", marginBottom: "1.5rem" }}>
                Anime
                {animes.length > 0 && (
                    <span style={{ fontSize: "1rem", fontWeight: "400", color: "rgba(255,255,255,0.35)", marginLeft: "12px" }}>
                        {animes.length} resultado{animes.length !== 1 ? "s" : ""}
                    </span>
                )}
            </h1>
            <FilterBar genres={genres} years={years} currentGenre={genre} currentYear={year} currentSort={sort} />
            <MovieGrid movies={animes} emptyMessage="No hay anime con esos filtros." />
        </div>
    );
}
