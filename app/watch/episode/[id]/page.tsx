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
                select: {
                    title: true,
                    requiredPlan: true
                }
            },
            servers: true
        }
    });

    if (!episodeItem) {
        return <div>Episode not found</div>;
    }

    const requiredPlan = episodeItem.movie.requiredPlan || "FREE";
    const subscription = (session.user as any)?.subscription;

    // Define plan hierarchy mapping
    const planHierarchy: Record<string, number> = {
        "FREE": 0,
        "BASIC": 1,
        "STANDARD": 2,
        "PREMIUM": 3
    };

    const moviePlanValue = planHierarchy[requiredPlan.toUpperCase()] || 0;

    // Default to FREE (0) if user has no subscription or inactive subscription
    let userPlanValue = 0;
    if (subscription && subscription.status === "ACTIVE") {
        userPlanValue = planHierarchy[subscription.plan.toUpperCase()] || 0;
    }

    // If the movie is not FREE, the user must have *some* paid active subscription (> 0)
    if (moviePlanValue > 0 && userPlanValue === 0) {
        redirect("/plans");
    }

    return (
        <PlayerClient
            title={`${episodeItem.movie.title} - ${episodeItem.seasonNumber}x${episodeItem.episodeNumber}: ${episodeItem.title}`}
            defaultUrl={episodeItem.videoUrl}
            servers={episodeItem.servers}
        />
    );
}
