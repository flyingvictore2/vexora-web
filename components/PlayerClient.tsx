"use client";

import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface VideoServer {
    id: string;
    name: string;
    url: string;
    quality: string;
}

interface EpisodeInfo {
    id: string;
    title: string;
    seasonNumber: number;
    episodeNumber: number;
}

interface PlayerClientProps {
    title: string;
    defaultUrl: string;
    servers: VideoServer[];
    // Movie only
    movieId?: string;
    // Episode fields
    seriesTitle?: string;
    episodeNumber?: number;
    seasonNumber?: number;
    episodeThumbnail?: string;
    episodeDescription?: string;
    prevEpisode?: EpisodeInfo | null;
    nextEpisode?: EpisodeInfo | null;
}

export default function PlayerClient({
    title,
    defaultUrl,
    servers,
    movieId,
    seriesTitle,
    episodeNumber,
    seasonNumber,
    episodeThumbnail,
    episodeDescription,
    prevEpisode,
    nextEpisode,
}: PlayerClientProps) {
    const router = useRouter();
    const isEpisode = episodeNumber !== undefined;

    const legacyServer: VideoServer = { id: "default-0", name: "Servidor Principal", url: defaultUrl, quality: "Auto" };
    const allServers = servers.length > 0 ? servers : [legacyServer];
    const [activeServer, setActiveServer] = useState<VideoServer>(allServers[0]);

    const backHref = isEpisode && movieId ? `/title/${movieId}` : "/";

    return (
        <div style={{ backgroundColor: "#0a0b10", minHeight: "100vh", paddingBottom: "3rem" }}>

            {/* ← VOLVER A LA FICHA */}
            <div style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                maxWidth: "1100px",
                margin: "0 auto",
                paddingLeft: "28px",
                paddingRight: "28px",
            }}>
                <Link href={backHref} style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", fontWeight: "700",
                    textDecoration: "none", letterSpacing: "0.5px", textTransform: "uppercase",
                    transition: "color 0.2s",
                }}
                    onMouseOver={e => (e.currentTarget.style.color = "white")}
                    onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                >
                    ← {isEpisode ? "Volver a la ficha" : "Volver"}
                </Link>
            </div>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

                {/* CABECERA DE EPISODIO */}
                {isEpisode && (
                    <div style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        marginTop: "16px",
                        marginBottom: "20px",
                    }}>
                        {/* Fila superior: nombre serie + episodio identificador */}
                        <div style={{
                            fontSize: "0.72rem", fontWeight: "700", color: "rgba(255,255,255,0.4)",
                            letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px",
                        }}>
                            {seriesTitle} — {seasonNumber}x{String(episodeNumber).padStart(2, "0")}
                        </div>

                        {/* Fila principal: thumbnail + info + botones */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

                            {/* Miniatura */}
                            {episodeThumbnail && (
                                <div style={{
                                    width: "140px", height: "79px", borderRadius: "8px",
                                    overflow: "hidden", flexShrink: 0, backgroundColor: "#111",
                                }}>
                                    <img src={episodeThumbnail} alt={title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                </div>
                            )}

                            {/* Título del episodio */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: "1.5rem", fontWeight: "900", color: "white",
                                    textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1.1,
                                }}>
                                    Episodio {episodeNumber}
                                </div>
                                <div style={{
                                    fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", marginTop: "4px",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                    {title}
                                </div>
                            </div>

                            {/* ANTERIOR / SIGUIENTE */}
                            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                <button
                                    onClick={() => prevEpisode && router.push(`/watch/episode/${prevEpisode.id}`)}
                                    disabled={!prevEpisode}
                                    style={{
                                        padding: "8px 16px", borderRadius: "8px", fontWeight: "700",
                                        fontSize: "0.78rem", letterSpacing: "0.5px", cursor: prevEpisode ? "pointer" : "not-allowed",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        color: prevEpisode ? "white" : "rgba(255,255,255,0.25)",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseOver={e => { if (prevEpisode) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"; }}
                                    onMouseOut={e => { if (prevEpisode) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                                >
                                    ← ANTERIOR
                                </button>
                                <button
                                    onClick={() => nextEpisode && router.push(`/watch/episode/${nextEpisode.id}`)}
                                    disabled={!nextEpisode}
                                    style={{
                                        padding: "8px 16px", borderRadius: "8px", fontWeight: "700",
                                        fontSize: "0.78rem", letterSpacing: "0.5px", cursor: nextEpisode ? "pointer" : "not-allowed",
                                        backgroundColor: nextEpisode ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${nextEpisode ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                                        color: nextEpisode ? "white" : "rgba(255,255,255,0.25)",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseOver={e => { if (nextEpisode) e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.35)"; }}
                                    onMouseOut={e => { if (nextEpisode) e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.2)"; }}
                                >
                                    SIGUIENTE →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SINOPSIS */}
                {(episodeDescription || !isEpisode) && (
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{
                            fontSize: "0.75rem", fontWeight: "800", color: "rgba(255,255,255,0.9)",
                            letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px",
                        }}>
                            Sinopsis
                        </h3>
                        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                            {episodeDescription || "No hay descripción disponible."}
                        </p>
                    </div>
                )}

                {/* REPRODUCTOR */}
                <div style={{ backgroundColor: "black", borderRadius: "10px", overflow: "hidden", lineHeight: 0 }}>
                    <VideoPlayer src={activeServer.url} title={isEpisode ? `${seriesTitle} - Ep. ${episodeNumber}` : title} />
                </div>

                {/* Selector de servidores (solo si hay más de uno) */}
                {allServers.length > 1 && (
                    <div style={{ marginTop: "16px" }}>
                        <p style={{
                            fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.35)",
                            letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px",
                        }}>
                            Servidores
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {allServers.map((srv) => {
                                const isActive = srv.id === activeServer.id;
                                return (
                                    <button
                                        key={srv.id}
                                        onClick={() => setActiveServer(srv)}
                                        style={{
                                            padding: "8px 16px", borderRadius: "8px",
                                            backgroundColor: isActive ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${isActive ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                                            color: isActive ? "white" : "rgba(255,255,255,0.5)",
                                            cursor: "pointer", fontWeight: "700", fontSize: "0.82rem",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {isActive && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#60a5fa", marginRight: 6 }} />}
                                        {srv.name}
                                        <span style={{ marginLeft: 6, fontSize: "0.65rem", opacity: 0.6 }}>{srv.quality}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
