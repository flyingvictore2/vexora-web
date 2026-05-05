import prisma from "@/lib/prisma";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
            episodes: {
                orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
            },
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

    const isSeriesOrAnime = movie.type === "SERIES" || movie.type === "ANIME";

    // Agrupar episodios por temporada
    const seasons: Record<number, typeof movie.episodes> = {};
    if (isSeriesOrAnime) {
        for (const ep of movie.episodes) {
            if (!seasons[ep.seasonNumber]) seasons[ep.seasonNumber] = [];
            seasons[ep.seasonNumber].push(ep);
        }
    }

    const seasonNumbers = Object.keys(seasons).map(Number).sort((a, b) => a - b);

    // Primer episodio para el botón de "Ver"
    const firstEpisode = movie.episodes[0] ?? null;

    return (
        <div style={{ paddingBottom: "4rem" }}>

            {/* Header: poster + info */}
            <div style={{
                display: "flex",
                gap: "3rem",
                backgroundColor: "rgba(11, 12, 16, 0.8)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: "3rem",
            }}>
                <div style={{ width: "280px", minWidth: "280px", flexShrink: 0 }}>
                    <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                </div>

                <div style={{ padding: "2.5rem 2.5rem 2.5rem 0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {/* Tipo badge */}
                    <span style={{
                        display: "inline-block", marginBottom: "0.75rem",
                        padding: "4px 12px", borderRadius: "6px", fontSize: "0.7rem",
                        fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase",
                        backgroundColor: movie.type === "ANIME" ? "rgba(139,92,246,0.2)" :
                            movie.type === "SERIES" ? "rgba(37,99,235,0.2)" : "rgba(229,9,20,0.2)",
                        color: movie.type === "ANIME" ? "#a78bfa" :
                            movie.type === "SERIES" ? "#60a5fa" : "#f87171",
                        border: `1px solid ${movie.type === "ANIME" ? "rgba(139,92,246,0.3)" :
                            movie.type === "SERIES" ? "rgba(37,99,235,0.3)" : "rgba(229,9,20,0.3)"}`,
                        width: "fit-content",
                    }}>
                        {movie.type === "ANIME" ? "Anime" : movie.type === "SERIES" ? "Serie" : "Película"}
                    </span>

                    <h1 style={{ fontSize: "2.6rem", fontWeight: "900", marginBottom: "1rem", color: "white", lineHeight: 1.15 }}>
                        {movie.title}
                    </h1>

                    <div style={{ display: "flex", gap: "1.2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                        <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>{movie.year}</span>
                        <span style={{ color: "#eab308", fontWeight: "700", fontSize: "0.9rem" }}>★ {movie.rating}</span>
                        <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>{movie.duration}</span>
                        <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>{movie.genre}</span>
                        {isSeriesOrAnime && movie.episodes.length > 0 && (
                            <span style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>
                                {movie.episodes.length} episodio{movie.episodes.length !== 1 ? "s" : ""}
                                {seasonNumbers.length > 1 ? ` · ${seasonNumbers.length} temporadas` : ""}
                            </span>
                        )}
                    </div>

                    <p style={{ fontSize: "1rem", lineHeight: "1.75", color: "#cbd5e1", marginBottom: "2rem", maxWidth: "600px" }}>
                        {movie.description || "No hay descripción disponible."}
                    </p>

                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {isSeriesOrAnime ? (
                            firstEpisode ? (
                                <Link
                                    href={`/watch/episode/${firstEpisode.id}`}
                                    className="btn btn-primary"
                                    style={{ padding: "0.9rem 2.5rem", fontSize: "1rem" }}
                                >
                                    ▶ Ver desde el inicio
                                </Link>
                            ) : (
                                <span style={{ color: "#64748b", fontSize: "0.9rem", padding: "0.9rem 0" }}>
                                    Próximamente
                                </span>
                            )
                        ) : movie.servers.length > 0 ? (
                            // Multiple servers: show a button per server
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>
                                    Servidores disponibles
                                </span>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {movie.servers.map((srv) => (
                                        <Link
                                            key={srv.id}
                                            href={`/watch/${movie.id}?s=${srv.id}`}
                                            className="server-btn"
                                        >
                                            ▶ {srv.name}
                                            <span className="server-btn-quality">{srv.quality}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Link
                                href={`/watch/${movie.id}`}
                                className="btn btn-primary"
                                style={{ padding: "0.9rem 2.5rem", fontSize: "1rem" }}
                            >
                                ▶ Ver ahora
                            </Link>
                        )}
                        <AddToListButton movieId={movie.id} />
                    </div>
                </div>
            </div>

            {/* Lista de episodios */}
            {isSeriesOrAnime && movie.episodes.length > 0 && (
                <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "white", marginBottom: "1.5rem", letterSpacing: "-0.5px" }}>
                        Episodios
                    </h2>

                    {seasonNumbers.map((seasonNum) => (
                        <div key={seasonNum} style={{ marginBottom: "2.5rem" }}>
                            {/* Cabecera de temporada */}
                            {seasonNumbers.length > 1 && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    marginBottom: "1rem",
                                }}>
                                    <span style={{
                                        padding: "4px 14px", borderRadius: "8px",
                                        backgroundColor: "rgba(37,99,235,0.15)",
                                        border: "1px solid rgba(37,99,235,0.25)",
                                        color: "#60a5fa", fontWeight: "800",
                                        fontSize: "0.8rem", letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}>
                                        Temporada {seasonNum}
                                    </span>
                                    <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                                </div>
                            )}

                            {/* Episodios de esta temporada */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {seasons[seasonNum].map((ep) => (
                                    <Link
                                        key={ep.id}
                                        href={`/watch/episode/${ep.id}`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <div className="ep-row" style={{
                                            display: "flex", alignItems: "center", gap: "16px",
                                            padding: "14px 20px",
                                            backgroundColor: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            borderRadius: "12px",
                                            transition: "all 0.2s",
                                            cursor: "pointer",
                                        }}>
                                            {/* Miniatura */}
                                            <div style={{
                                                width: "120px", height: "68px", borderRadius: "8px",
                                                overflow: "hidden", flexShrink: 0,
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                position: "relative",
                                            }}>
                                                {ep.thumbnailUrl ? (
                                                    <img
                                                        src={ep.thumbnailUrl}
                                                        alt={ep.title}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: "100%", height: "100%",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: "1.5rem",
                                                    }}>
                                                        ▶
                                                    </div>
                                                )}
                                                {/* Play overlay */}
                                                <div style={{
                                                    position: "absolute", inset: 0,
                                                    backgroundColor: "rgba(0,0,0,0.3)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    opacity: 0, transition: "opacity 0.2s",
                                                }}
                                                    className="ep-play-overlay"
                                                >
                                                    <span style={{ fontSize: "1.2rem", color: "white" }}>▶</span>
                                                </div>
                                            </div>

                                            {/* Número */}
                                            <div style={{
                                                width: "36px", flexShrink: 0, textAlign: "center",
                                                fontSize: "1.1rem", fontWeight: "900",
                                                color: "rgba(255,255,255,0.25)",
                                            }}>
                                                {ep.episodeNumber}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: "700", color: "white",
                                                    fontSize: "0.95rem", marginBottom: "4px",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {ep.title}
                                                </div>
                                                <div style={{
                                                    fontSize: "0.8rem", color: "rgba(255,255,255,0.4)",
                                                    overflow: "hidden", textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}>
                                                    {ep.description || "Sin descripción"}
                                                </div>
                                            </div>

                                            {/* Duración + flecha */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", fontWeight: "600" }}>
                                                    {movie.duration}
                                                </span>
                                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem" }}>›</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        <style dangerouslySetInnerHTML={{ __html: `
            .ep-row:hover {
                background-color: rgba(255,255,255,0.07) !important;
                border-color: rgba(37,99,235,0.3) !important;
            }
            .server-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 0.75rem 1.6rem;
                background-color: rgba(229,9,20,0.85);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 800;
                font-size: 0.88rem;
                letter-spacing: 0.5px;
                transition: background 0.2s, transform 0.15s;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .server-btn:hover {
                background-color: rgba(229,9,20,1);
                transform: scale(1.03);
            }
            .server-btn-quality {
                font-size: 0.65rem;
                font-weight: 700;
                padding: 2px 7px;
                border-radius: 4px;
                background-color: rgba(0,0,0,0.35);
                letter-spacing: 0.3px;
            }
        `}} />
        </div>
    );
}
