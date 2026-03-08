const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const movies = await prisma.movie.findMany({ take: 1 });
        console.log("Movies fetch successful:", movies.length);
        const history = await prisma.watchHistory.findMany({ take: 1 });
        console.log("WatchHistory fetch successful:", history.length);
        const myList = await prisma.myList.findMany({ take: 1 });
        console.log("MyList fetch successful:", myList.length);
        const episodes = await prisma.episode.findMany({ take: 1 });
        console.log("Episodes fetch successful:", episodes.length);
    } catch (error) {
        console.error("Prisma error:", error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
