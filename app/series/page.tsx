import React from "react";
import prisma from "@/lib/prisma";
import Row from "@/components/Row";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
    const series = await prisma.movie.findMany({
        where: {
            type: "SERIE"
        }
    });

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <Row title="Series" movies={series} isLargeRow />
            <Row title="Recomendadas" movies={series.slice().reverse()} />
        </div>
    );
}
