import PlayerClient from "@/components/PlayerClient";
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WatchEpisodePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login");
    }

    const episodeItem = await prisma.episode.findUnique({
        where: { id },
        include: {
            movie: {
                select: { id: true, title: true, requiredPlan: true }
            },
            servers: true,
        },
    });

    if (!episodeItem) {
        return <div>Episode not found</div>;
    }

    const requiredPlan = episodeItem.movie.requiredPlan || "FREE";
    const subscription = (session.user as any)?.subscription;

    const planHierarchy: Record<string, number> = {
        "FREE": 0, "BASIC": 1, "STANDARD": 2, "PREMIUM": 3,
    };

    const moviePlanValue = planHierarchy[requiredPlan.toUpperCase()] || 0;
    let userPlanValue = 0;
    if (subscription && subscription.status === "ACTIVE") {
        userPlanValue = planHierarchy[subscription.plan.toUpperCase()] || 0;
    }

    if (moviePlanValue > 0 && userPlanValue === 0) {
        redirect("/plans");
    }

    // Obtener todos los episodios de la misma serie, ordenados
    const allEpisodes = await prisma.episode.findMany({
        where: { movieId: episodeItem.movieId },
        orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        select: { id: true, title: true, seasonNumber: true, episodeNumber: true },
    });

    const currentIndex = allEpisodes.findIndex(e => e.id === id);
    const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
    const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

    return (
        <PlayerClient
            title={`T${episodeItem.seasonNumber} E${episodeItem.episodeNumber}: ${episodeItem.title}`}
            defaultUrl={episodeItem.videoUrl}
            servers={episodeItem.servers}
            seriesTitle={episodeItem.movie.title}
            prevEpisode={prevEpisode}
            nextEpisode={nextEpisode}
        />
    );
}
