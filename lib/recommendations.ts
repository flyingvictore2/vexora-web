import prisma from "@/lib/prisma";

export async function getRecommendations(profileId?: string) {
    // In a real app, we would look at watch history and user preferences
    // For now, we'll return a random selection of movies
    // Or if we had genres, we could filter by favorite genre

    const count = await prisma.movie.count();
    const take = 5;
    const skip = Math.max(0, Math.floor(Math.random() * (count - take)));

    const recommendations = await prisma.movie.findMany({
        take: take,
        skip: skip,
    });

    return recommendations;
}

export async function getMoviesByGenre(genre: string) {
    return await prisma.movie.findMany({
        where: {
            genre: {
                contains: genre // loose match
            }
        }
    });
}

export async function getAllMovies() {
    return await prisma.movie.findMany();
}
