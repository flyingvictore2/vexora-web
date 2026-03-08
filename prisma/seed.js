const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const movies = [
    {
        title: "Stranger Things",
        description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: "1 season",
        genre: "Sci-Fi",
        rating: "TV-14",
        year: 2016
    },
    {
        title: "The Crown",
        description: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/H5KgTsRvbHilltyvD9yT8XK1X6.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        duration: "4 seasons",
        genre: "Drama",
        rating: "TV-MA",
        year: 2016
    },
    {
        title: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: "2h 28m",
        genre: "Action",
        rating: "PG-13",
        year: 2010
    },
    {
        title: "Interstellar",
        description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: "2h 49m",
        genre: "Sci-Fi",
        rating: "PG-13",
        year: 2014
    },
    {
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: "2h 32m",
        genre: "Action",
        rating: "PG-13",
        year: 2008
    },
    {
        title: "Avengers: Endgame",
        description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: "3h 1m",
        genre: "Action",
        rating: "PG-13",
        year: 2019
    },
    {
        title: "Spider-Man: Into the Spider-Verse",
        description: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
        thumbnailUrl: "https://image.tmdb.org/t/p/original/iiZZdoQBEYBv6id8su7Im00O07.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: "1h 57m",
        genre: "Animation",
        rating: "PG",
        year: 2018
    }
];

async function main() {
    console.log(`Start seeding ...`);
    for (const movie of movies) {
        const mt = await prisma.movie.create({
            data: movie,
        });
        console.log(`Created movie with id: ${mt.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
