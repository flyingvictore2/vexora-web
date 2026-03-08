import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get("profileId");

        if (!profileId) {
            return new NextResponse("Missing profileId", { status: 400 });
        }

        // 1. Get user's watch history and my list to find preferred genres
        const [watchHistory, myList] = await Promise.all([
            prisma.watchhistory.findMany({
                where: { profileId },
                include: { movie: true }
            }),
            prisma.mylist.findMany({
                where: { profileId },
                include: { movie: true }
            })
        ]);

        const watchedMovieIds = new Set(watchHistory.map(h => h.movieId));
        const listedMovieIds = new Set(myList.map(l => l.movieId));
        const allInteractedIds = new Set([...watchedMovieIds, ...listedMovieIds]);

        // Extract genres from interacted movies
        const genres = new Set<string>();
        watchHistory.forEach(h => {
            h.movie.genre.split(",").forEach(g => genres.add(g.trim()));
        });
        myList.forEach(l => {
            l.movie.genre.split(",").forEach(g => genres.add(g.trim()));
        });

        let recommendations: any[] = [];

        if (genres.size > 0) {
            // 2. Find movies with matching genres that the user hasn't interacted with much
            // We'll search for movies that share at least one genre
            const now = new Date();
            const genreList = Array.from(genres);

            recommendations = await prisma.movie.findMany({
                where: {
                    OR: genreList.map(genre => ({
                        genre: {
                            contains: genre
                        }
                    })),
                    AND: [
                        {
                            NOT: {
                                id: {
                                    in: Array.from(allInteractedIds)
                                }
                            }
                        },
                        {
                            OR: [
                                { releaseDate: null },
                                { releaseDate: { lte: now } }
                            ]
                        }
                    ]
                },
                take: 10
            });
        }

        // 3. Fallback: If no history or not enough recommendations, get top rated / general movies
        if (recommendations.length < 5) {
            const now = new Date();
            const extraMovies = await prisma.movie.findMany({
                where: {
                    AND: [
                        {
                            NOT: {
                                id: {
                                    in: Array.from(allInteractedIds) as string[]
                                }
                            }
                        },
                        {
                            OR: [
                                { releaseDate: null },
                                { releaseDate: { lte: now } }
                            ]
                        }
                    ]
                },
                orderBy: {
                    rating: 'desc'
                },
                take: 10 - recommendations.length
            });
            recommendations = [...recommendations, ...extraMovies];
        }

        // Shuffle recommendations a bit for variety if we have enough
        recommendations = recommendations.sort(() => Math.random() - 0.5);

        return NextResponse.json(recommendations);
    } catch (error) {
        console.error("RECOMMENDATIONS_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
