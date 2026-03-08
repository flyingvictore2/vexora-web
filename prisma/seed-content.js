const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const movies = [
    {
        title: "Stranger Things",
        description: "Cuando un niño desaparece, sus amigos, su familia y la policía se ven envueltos en una serie de eventos misteriosos al tratar de encontrarlo. Su ausencia coincide con un experimento secreto del gobierno y una niña peculiar con poderes.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/630fd8632668386348ef520d/backgrounds/63102375837651003d0928e4.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: "4 Temporadas",
        genre: "Ciencia Ficción",
        rating: "13+",
        year: 2016
    },
    {
        title: "The Witcher",
        description: "Geralt de Rivia, un cazador de monstruos mutante, viaja en pos de su destino por un mundo turbulento en el que, a menudo, los humanos son peores que las bestias.",
        thumbnailUrl: "https://www.themoviedb.org/t/p/original/7v8v3o58RzB14e2E7Ube75W50fV.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        duration: "3 Temporadas",
        genre: "Fantasía",
        rating: "18+",
        year: 2019
    },
    {
        title: "Inception",
        description: "Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños tiene la oportunidad de limpiar su historial criminal si logra implantar una idea en la mente de un director general.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/5d7768406f4770001f30737a/backgrounds/default.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: "2h 28m",
        genre: "Acción",
        rating: "13+",
        year: 2010
    },
    {
        title: "The Boys",
        description: "Una visión irreverente de lo que ocurre cuando los superhéroes, tan populares como las celebridades y tan influyentes como los políticos, abusan de sus superpoderes en lugar de utilizarlos para el bien.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/63103448837651003d092925/backgrounds/63103448837651003d092925.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: "4 Temporadas",
        genre: "Acción",
        rating: "18+",
        year: 2019
    },
    {
        title: "Interstellar",
        description: "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/5d776840ef4770001f2fde9a/backgrounds/default.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: "2h 49m",
        genre: "Ciencia Ficción",
        rating: "7+",
        year: 2014
    },
    {
        title: "Breaking Bad",
        description: "Un profesor de química de secundaria con cáncer de pulmón terminal se asocia con un exalumno para fabricar y vender metanfetamina con el fin de asegurar el futuro financiero de su familia.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/630fc601837651003d09268f/backgrounds/630fc601837651003d09268f.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: "5 Temporadas",
        genre: "Drama",
        rating: "18+",
        year: 2008
    },
    {
        title: "Spider-Man: Across the Spider-Verse",
        description: "Miles Morales regresa para el siguiente capítulo de la saga ganadora del Oscar del Spider-Verso, una aventura épica que transportará al amigable vecino de Brooklyn a través del Multiverso.",
        thumbnailUrl: "https://www.themoviedb.org/t/p/original/8Vtbb9v9S689I3S78v6SrnAxD9.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: "2h 20m",
        genre: "Animación",
        rating: "7+",
        year: 2023
    },
    {
        title: "The Batman",
        description: "Cuando un asesino se dirige a la élite de Gotham con una serie de maquinaciones sádicas, un rastro de pistas crípticas envía al Mejor Detective del Mundo a una investigación por los bajos fondos.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/62095f9d837651002e0787e6/backgrounds/620a8f88837651002e078832.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        duration: "2h 56m",
        genre: "Acción",
        rating: "13+",
        year: 2022
    },
    {
        title: "Dune",
        description: "Paul Atreides, un joven brillante y talentoso nacido con un gran destino más allá de su comprensión, debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia y su pueblo.",
        thumbnailUrl: "https://images.plex.tv/api/v2/containers/60f76901837651002d07677a/backgrounds/60f78a88837651002d0767c6.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackAds.mp4",
        duration: "2h 35m",
        genre: "Ciencia Ficción",
        rating: "13+",
        year: 2021
    },
    {
        title: "John Wick: Chapter 4",
        description: "John Wick descubre un camino para derrotar a la Alta Mesa. Pero antes de ganar su libertad, Wick debe enfrentarse a un nuevo enemigo con poderosas alianzas en todo el mundo.",
        thumbnailUrl: "https://www.themoviedb.org/t/p/original/h8GvSdbvX9h979T97j919o7Z0Y3.jpg",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        duration: "2h 49m",
        genre: "Acción",
        rating: "18+",
        year: 2023
    }
];

async function main() {
    console.log('Iniciando carga de contenido...');

    for (const movie of movies) {
        const upsertedMovie = await prisma.movie.upsert({
            where: { id: movie.id || 'placeholder-' + movie.title.replace(/\s+/g, '-').toLowerCase() },
            update: movie,
            create: movie,
        });
        console.log(`Cargado: ${upsertedMovie.title}`);
    }

    console.log('Carga finalizada con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
