import React from "react";
import prisma from "@/lib/prisma";
import Row from "@/components/Row";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
    const movies = await prisma.movie.findMany({
        where: {
            type: "MOVIE"
        }
    });

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <Row title="Películas" movies={movies} isLargeRow />
            <Row title="Más Películas" movies={movies.slice().reverse()} />
        </div>
    );
}
