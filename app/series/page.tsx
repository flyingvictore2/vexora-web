import React from "react";
import prisma from "@/lib/prisma";
import FilterBar from "@/components/FilterBar";
import MovieGrid from "@/components/MovieGrid";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ genre?: string; year?: string; sort?: string }>;
}

export default async function SeriesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const genre = params.genre || "";
    const year = params.year || "";
    const sort = params.sort || "";

    // Build filter — support both "SERIE" and "SERIES" values
    const where: Record<string, unknown> = { type: { in: ["SERIE", "SERIES"] } };
    if (genre) where.genre = genre;
    if (year) where.year = parseInt(year);

    // Fetch filtered series
    let series = await prisma.movie.findMany({
        where,
        orderBy: sort === "oldest" ? { createdAt: "asc" } : sort === "az" ? { title: "asc" } : { createdAt: "desc" },
    });

    if (sort === "rating") {
        series = series.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
    }

    // Get all genres and years for FilterBar (unfiltered)
    const allSeries = await prisma.movie.findMany({
        where: { type: { in: ["SERIE", "SERIES"] } },
        select: { genre: true, year: true },
    });
    const genres = [...new Set(allSeries.map(m => m.genre).filter(Boolean))].sort() as string[];
    const years = [...new Set(allSeries.map(m => m.year).filter(Boolean))].sort((a, b) => b - a) as number[];

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "800", marginBottom: "1.5rem" }}>
                Series
                {series.length > 0 && (
                    <span style={{ fontSize: "1rem", fontWeight: "400", color: "rgba(255,255,255,0.35)", marginLeft: "12px" }}>
                        {series.length} resultado{series.length !== 1 ? "s" : ""}
                    </span>
                )}
            </h1>
            <FilterBar genres={genres} years={years} currentGenre={genre} currentYear={year} currentSort={sort} />
            <MovieGrid movies={series} emptyMessage="No hay series con esos filtros." />
        </div>
    );
}
