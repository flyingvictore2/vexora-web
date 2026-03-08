import prisma from "@/lib/prisma";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";
import styles from "@/components/Row.module.css";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const movie = await prisma.movie.findUnique({
        where: { id }
    });

    if (!movie) {
        return <div style={{ color: "white", padding: "100px", textAlign: 'center' }}>Contenido no encontrado</div>;
    }

    return (
        <div style={{ paddingBottom: "2rem" }}>

            <div style={{
                display: 'flex',
                gap: '3rem',
                backgroundColor: 'rgba(11, 12, 16, 0.8)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '3rem'
            }}>
                <div style={{ width: '350px', minWidth: '350px' }}>
                    <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <div style={{ padding: '3rem', flex: 1 }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>{movie.title}</h1>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', color: '#94a3b8', fontWeight: '600' }}>
                        <span>Estreno: {movie.year}</span>
                        <span style={{ color: '#eab308' }}>★ {movie.rating}</span>
                        <span>{movie.duration}</span>
                        <span>{movie.genre}</span>
                    </div>

                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1', marginBottom: '3rem' }}>
                        {movie.description}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href={`/watch/${movie.id}`} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                            ▶ VER AHORA
                        </Link>
                        <AddToListButton movieId={movie.id} />
                    </div>
                </div>
            </div>

            <Row title="Títulos Relacionados" movies={[]} />
        </div>
    );
}

function Row({ title, movies }: { title: string, movies: any[] }) {
    return (
        <div className={styles.row}>
            <h2 className={styles.rowTitle}>{title}</h2>
            <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                Próximamente verás aquí recomendaciones similares.
            </div>
        </div>
    );
}
