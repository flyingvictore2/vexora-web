import prisma from "@/lib/prisma";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";
import TitleTabs from "./TitleTabs";
import BackButton from "@/components/BackButton";
import RatingStars from "@/components/RatingStars";
import TitleActions from "@/components/TitleActions";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
            episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }] },
            servers: true,
        },
    });

    if (!movie) {
        return (
            <div style={{ color: "white", padding: "100px", textAlign: "center" }}>
                Contenido no encontrado
            </div>
        );
    }

    // Similar movies (same genre, different id)
    const similarMovies = await prisma.movie.findMany({
        where: { genre: movie.genre, id: { not: id } },
        take: 8,
        select: { id: true, title: true, thumbnailUrl: true, rating: true, type: true },
    });

    const isSeriesOrAnime = movie.type === "SERIE" || movie.type === "ANIME";

    // Build server list — fall back to videoUrl if no dedicated servers
    const displayServers = movie.servers.length > 0
        ? movie.servers.map(s => ({ id: s.id, name: s.name, quality: s.quality, href: `/watch/${movie.id}?s=${s.id}` }))
        : movie.videoUrl
            ? [{ id: "default", name: "Servidor 1", quality: "Auto", href: `/watch/${movie.id}` }]
            : [];

    const primaryHref = isSeriesOrAnime
        ? (movie.episodes[0] ? `/watch/episode/${movie.episodes[0].id}` : null)
        : (displayServers[0]?.href ?? null);

    // Type badge colours
    const typeInfo = movie.type === "ANIME"
        ? { label: "Anime",    color: "#a78bfa", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" }
        : movie.type === "SERIE"
            ? { label: "Serie",    color: "#60a5fa", bg: "rgba(37,99,235,0.15)",  border: "rgba(37,99,235,0.3)" }
            : { label: "Película", color: "#f87171", bg: "rgba(229,9,20,0.15)",   border: "rgba(229,9,20,0.3)" };

    // Episodes serialised (avoid Prisma Date objects in client props)
    const episodes = movie.episodes.map(e => ({
        id: e.id,
        title: e.title,
        episodeNumber: e.episodeNumber,
        seasonNumber: e.seasonNumber,
        thumbnailUrl: e.thumbnailUrl,
        description: e.description,
    }));

    return (
        <div style={{ paddingBottom: "4rem", color: "white" }}>
            {/* ← Volver */}
            <BackButton />

            <div style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr 260px",
                gap: "2rem",
                alignItems: "start",
            }}>

                {/* ── LEFT: poster + meta ───────────────────────── */}
                <aside>
                    <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" }}>
                        <img
                            src={movie.thumbnailUrl}
                            alt={movie.title}
                            style={{ width: "100%", display: "block" }}
                        />
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "7px" }}>
                        {movie.year && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.82rem", color: "#94a3b8" }}>
                                <span>📅</span> {movie.year}
                            </div>
                        )}
                        {movie.duration && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.82rem", color: "#94a3b8" }}>
                                <span>⏱</span> {movie.duration}
                            </div>
                        )}
                        {movie.rating && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.82rem", color: "#eab308", fontWeight: "700" }}>
                                <span>★</span> {movie.rating}
                            </div>
                        )}
                        {movie.genre && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.82rem", color: "#94a3b8" }}>
                                <span>🎬</span> {movie.genre}
                            </div>
                        )}
                        {isSeriesOrAnime && movie.episodes.length > 0 && (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.82rem", color: "#94a3b8" }}>
                                <span>📺</span> {movie.episodes.length} ep.
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── MAIN: title + tabs ─────────────────────────── */}
                <main>
                    {/* Badges */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                        <span style={{
                            padding: "3px 12px", borderRadius: "4px", fontSize: "0.7rem",
                            fontWeight: "800", letterSpacing: "0.8px", textTransform: "uppercase",
                            backgroundColor: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.border}`,
                        }}>{typeInfo.label}</span>
                        {movie.genre && (
                            <span style={{
                                padding: "3px 12px", borderRadius: "4px", fontSize: "0.7rem",
                                fontWeight: "800", letterSpacing: "0.8px", textTransform: "uppercase",
                                backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)",
                            }}>{movie.genre}</span>
                        )}
                        {movie.requiredPlan && movie.requiredPlan !== "FREE" && (
                            <span style={{
                                padding: "3px 12px", borderRadius: "4px", fontSize: "0.7rem",
                                fontWeight: "800", letterSpacing: "0.8px", textTransform: "uppercase",
                                backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)",
                            }}>{movie.requiredPlan}</span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: "2.6rem", fontWeight: "900", lineHeight: 1.1,
                        marginBottom: "1.25rem", letterSpacing: "-0.5px",
                    }}>
                        {movie.title}
                    </h1>

                    {/* Action row */}
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                        {primaryHref && (
                            <Link href={primaryHref} className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", fontWeight: "800" }}>
                                ▶ VER AHORA
                            </Link>
                        )}
                        <AddToListButton movieId={movie.id} />
                        <TitleActions movieId={movie.id} />
                    </div>

                    {/* Sinopsis */}
                    {movie.description && (
                        <div style={{ marginBottom: "0.5rem" }}>
                            <h3 style={{ fontSize: "0.72rem", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>
                                SINOPSIS
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "#cbd5e1", lineHeight: "1.75", maxWidth: "680px" }}>
                                {movie.description}
                            </p>
                        </div>
                    )}

                    {/* Valoración */}
                    <div style={{ margin: "1.25rem 0 0.5rem" }}>
                        <RatingStars movieId={movie.id} size="lg" />
                    </div>

                    {/* Tabs: ENLACES / EPISODIOS */}
                    <TitleTabs
                        servers={displayServers}
                        isSeriesOrAnime={isSeriesOrAnime}
                        episodes={episodes}
                        movieId={movie.id}
                    />
                </main>

                {/* ── RIGHT: similares ──────────────────────────── */}
                {similarMovies.length > 0 && (
                    <aside>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                            <div style={{ width: "3px", height: "16px", backgroundColor: "#e50914", borderRadius: "2px" }} />
                            <h3 style={{ fontSize: "0.82rem", fontWeight: "800", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                                SIMILARES
                            </h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {similarMovies.map(m => {
                                const href = (m.type === "SERIE" || m.type === "ANIME") ? `/series/${m.id}` : `/title/${m.id}`;
                                return (
                                    <Link key={m.id} href={href} style={{ textDecoration: "none", display: "flex", gap: "10px", alignItems: "center" }} className="similar-row">
                                        <div style={{ position: "relative", flexShrink: 0, width: "90px", height: "52px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#1e293b" }}>
                                            <img src={m.thumbnailUrl} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            {m.rating && (
                                                <span style={{ position: "absolute", top: "3px", left: "3px", fontSize: "0.62rem", fontWeight: "800", backgroundColor: "rgba(0,0,0,0.75)", color: "#eab308", padding: "1px 5px", borderRadius: "3px" }}>
                                                    ★ {m.rating}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {m.title}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .ep-row:hover {
                    background-color: rgba(255,255,255,0.07) !important;
                    border-color: rgba(37,99,235,0.3) !important;
                }
                .similar-row:hover img {
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                @media (max-width: 900px) {
                    .title-grid { grid-template-columns: 1fr !important; }
                }
            `}} />
        </div>
    );
}
