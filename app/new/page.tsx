import React from "react";
import prisma from "@/lib/prisma";
import Hero from "@/components/Hero";
import Row from "@/components/Row";

export const dynamic = "force-dynamic";

export default async function NewAndPopularPage() {
    const movies = await prisma.movie.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });

    const randomMovie = movies.length > 0 ? movies[Math.floor(Math.random() * movies.length)] : null;

    return (
        <main style={{ backgroundColor: "#141414", minHeight: "100vh", paddingBottom: "2rem" }}>
            {randomMovie && <Hero movie={randomMovie} />}
            <div style={{ marginTop: randomMovie ? "-100px" : "100px", position: "relative", zIndex: 10 }}>
                <Row title="New & Popular" movies={movies} isLargeRow />
            </div>
        </main>
    );
}
