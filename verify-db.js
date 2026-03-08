const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Database Persistence ---');

    // 1. Create a test movie
    const testMovie = await prisma.movie.create({
        data: {
            title: "Test Movie " + Date.now(),
            description: "This is a verification movie to ensure MySQL Saving works.",
            thumbnailUrl: "https://via.placeholder.com/300",
            videoUrl: "https://test-video.com",
            duration: "1h 30m",
            genre: "Test",
            rating: "G",
            year: 2024,
        }
    });
    console.log('✅ Movie created successfully:', testMovie.title);

    // 2. Query it back
    const movies = await prisma.movie.findMany({
        where: { title: testMovie.title }
    });

    if (movies.length > 0) {
        console.log('✅ Movie found in database!');
    } else {
        throw new Error('❌ Movie not found after creation!');
    }

    // 3. Check for existing users (from my previous curl test)
    const users = await prisma.user.findMany();
    console.log(`✅ Total users in database: ${users.length}`);

    console.log('--- Verification Complete: DATA IS PERSISTING CORRECTLY ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
