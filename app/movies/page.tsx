import React from "react";
import prisma from "@/lib/prisma";
import FilterBar from "@/components/FilterBar";
import MovieGrid from "@/components/MovieGrid";
import { ensureMigrations } from "@/lib/migrate";
export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ genre?: string; year?: string; sort?: string }>;
}

export default async function MoviesPage({ searchParams }: PageProps) {
    await ensureMigrations(); // also self-heals hidden column now

    const params = await searchParams;
    const genre = params.genre || "";
    const year  = params.year  || "";
    const sort  = params.sort  || "";

    const conditions: string[] = [`type = 'MOVIE'`, `(hidden IS NULL OR hidden = false)`];
    const values: any[] = [];
    let idx = 1;
    if (genre) { conditions.push(`genre = $${idx++}`); values.push(genre); }
    if (year)  { conditions.push(`year = $${idx++}`);  values.push(parseInt(year)); }

    const orderSQL =
        sort === "oldest" ? `"createdAt" ASC` :
        sort === "az"     ? `title ASC` :
                            `"createdAt" DESC`;

    const sql = `SELECT * FROM movie WHERE ${conditions.join(" AND ")} ORDER BY ${orderSQL}`;
    let movies: any[] = await prisma.$queryRawUnsafe(sql, ...values);
    movies = movies.map(m => ({ ...m, year: Number(m.year), views: Number(m.views ?? 0) }));

    if (sort === "rating") {
        movies = movies.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
    }

    const meta = await prisma.$queryRawUnsafe<any[]>(
        `SELECT genre, year FROM movie WHERE type = 'MOVIE' AND (hidden IS NULL OR hidden = false)`
    );
    const genres = [...new Set(meta.map(m => m.genre).filter(Boolean))].sort() as string[];
    const years  = [...new Set(meta.map(m => Number(m.year)).filter(Boolean))].sort((a, b) => b - a) as number[];

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "800", marginBottom: "1.5rem" }}>
                Películas
                {movies.length > 0 && (
                    <span style={{ fontSize: "1rem", fontWeight: "400", color: "rgba(255,255,255,0.35)", marginLeft: "12px" }}>
                        {movies.length} resultado{movies.length !== 1 ? "s" : ""}
                    </span>
                )}
            </h1>
            <FilterBar genres={genres} years={years} currentGenre={genre} currentYear={year} currentSort={sort} />
            <MovieGrid movies={movies} emptyMessage="No hay películas con esos filtros." />
        </div>
    );
}
