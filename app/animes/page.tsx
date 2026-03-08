import React from "react";
import prisma from "@/lib/prisma";
import Row from "@/components/Row";

export const dynamic = "force-dynamic";

export default async function AnimesPage() {
    const animes = await prisma.movie.findMany({
        where: {
            type: "ANIME"
        }
    });

    const displayMovies = animes.length > 0 ? animes : await prisma.movie.findMany({ where: { type: "ANIME" }, take: 10 });

    return (
        <div style={{ paddingBottom: "2rem" }}>
            {animes.length > 0 ? (
                <>
                    <Row title="Animes" movies={displayMovies} isLargeRow />
                    <Row title="Lo más visto en Anime" movies={displayMovies.slice().reverse()} />
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Sección de Anime</h2>
                    <p style={{ color: '#94a3b8' }}>Estamos preparando el mejor contenido para ti. Mientras tanto, echa un vistazo a estas recomendaciones.</p>
                    <div style={{ marginTop: '3rem' }}>
                        <Row title="Recomendados para ti" movies={displayMovies} isLargeRow />
                    </div>
                </div>
            )}
        </div>
    );
}
