"use client";

import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { useRouter } from "next/navigation";

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
    seriesTitle?: string;
    prevEpisode?: EpisodeInfo | null;
    nextEpisode?: EpisodeInfo | null;
}

export default function PlayerClient({
    title,
    defaultUrl,
    servers,
    seriesTitle,
    prevEpisode,
    nextEpisode,
}: PlayerClientProps) {
    const router = useRouter();

    const legacyServer: VideoServer = {
        id: "default-0",
        name: "Servidor Principal",
        url: defaultUrl,
        quality: "Auto",
    };

    const allServers = servers.length > 0 ? servers : [legacyServer];
    const [activeServer, setActiveServer] = useState<VideoServer>(allServers[0]);

    const isEpisode = !!(prevEpisode !== undefined || nextEpisode !== undefined);

    return (
        <div style={{ backgroundColor: "#07080c", minHeight: "100vh" }}>

            {/* Barra superior: volver + título */}
            <div style={{
                padding: "14px 28px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(0,0,0,0.4)",
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                        fontWeight: "700", cursor: "pointer", fontSize: "0.85rem",
                        letterSpacing: "0.5px", textTransform: "uppercase",
                        transition: "color 0.2s", flexShrink: 0,
                    }}
                    onMouseOver={e => e.currentTarget.style.color = "white"}
                    onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                >
                    ← Volver
                </button>
                <div style={{ height: "16px", width: "1px", backgroundColor: "rgba(255,255,255,0.15)" }} />
                {seriesTitle && (
                    <span style={{ color: "var(--primary)", fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>
                        {seriesTitle}
                    </span>
                )}
                <span style={{
                    color: "rgba(255,255,255,0.9)", fontWeight: "600", fontSize: "0.9rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {title}
                </span>
            </div>

            {/* Reproductor — contenedor centrado con márgenes */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>
                <div style={{ backgroundColor: "black", borderRadius: "0 0 12px 12px", overflow: "hidden", lineHeight: 0 }}>
                    <VideoPlayer src={activeServer.url} title={title} />
                </div>
            </div>

            {/* Panel inferior */}
            <div style={{ padding: "24px 32px 40px", maxWidth: "1100px", margin: "0 auto" }}>

                {/* Navegación de episodios */}
                {isEpisode && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        marginBottom: "28px",
                        padding: "16px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                        <button
                            onClick={() => prevEpisode && router.push(`/watch/episode/${prevEpisode.id}`)}
                            disabled={!prevEpisode}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "10px 20px", borderRadius: "10px",
                                backgroundColor: prevEpisode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${prevEpisode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
                                color: prevEpisode ? "white" : "rgba(255,255,255,0.25)",
                                cursor: prevEpisode ? "pointer" : "not-allowed",
                                fontWeight: "700", fontSize: "0.85rem",
                                transition: "all 0.2s",
                                minWidth: "160px", justifyContent: "center",
                            }}
                            onMouseOver={e => { if (prevEpisode) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"; }}
                            onMouseOut={e => { if (prevEpisode) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; }}
                        >
                            ← Anterior
                            {prevEpisode && (
                                <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: "400" }}>
                                    S{prevEpisode.seasonNumber}E{prevEpisode.episodeNumber}
                                </span>
                            )}
                        </button>

                        {/* Indicador episodio actual */}
                        <div style={{ textAlign: "center", padding: "0 16px" }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
                                Reproduciendo
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "white", fontWeight: "700", marginTop: "2px" }}>
                                {title}
                            </div>
                        </div>

                        <button
                            onClick={() => nextEpisode && router.push(`/watch/episode/${nextEpisode.id}`)}
                            disabled={!nextEpisode}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "10px 20px", borderRadius: "10px",
                                backgroundColor: nextEpisode ? "var(--primary)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${nextEpisode ? "var(--primary)" : "rgba(255,255,255,0.05)"}`,
                                color: nextEpisode ? "white" : "rgba(255,255,255,0.25)",
                                cursor: nextEpisode ? "pointer" : "not-allowed",
                                fontWeight: "700", fontSize: "0.85rem",
                                transition: "all 0.2s",
                                minWidth: "160px", justifyContent: "center",
                                boxShadow: nextEpisode ? "0 4px 15px rgba(37,99,235,0.35)" : "none",
                            }}
                            onMouseOver={e => { if (nextEpisode) e.currentTarget.style.opacity = "0.85"; }}
                            onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
                        >
                            {nextEpisode && (
                                <span style={{ fontSize: "0.75rem", opacity: 0.8, fontWeight: "400" }}>
                                    S{nextEpisode.seasonNumber}E{nextEpisode.episodeNumber}
                                </span>
                            )}
                            Siguiente →
                        </button>
                    </div>
                )}

                {/* Selección de servidor */}
                {allServers.length > 1 && (
                    <div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
                            Servidores disponibles
                        </p>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {allServers.map((srv) => {
                                const isActive = srv.id === activeServer.id;
                                return (
                                    <button
                                        key={srv.id}
                                        onClick={() => setActiveServer(srv)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "8px",
                                            padding: "10px 18px", borderRadius: "10px",
                                            backgroundColor: isActive ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${isActive ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                                            color: isActive ? "white" : "rgba(255,255,255,0.6)",
                                            cursor: "pointer", fontWeight: isActive ? "700" : "500",
                                            fontSize: "0.85rem", transition: "all 0.2s",
                                        }}
                                        onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                                        onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                                    >
                                        {isActive && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", display: "inline-block" }} />}
                                        {srv.name}
                                        <span style={{
                                            fontSize: "0.65rem", fontWeight: "800", padding: "2px 6px",
                                            borderRadius: "4px", letterSpacing: "0.5px",
                                            backgroundColor: isActive ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.08)",
                                            color: isActive ? "#93c5fd" : "rgba(255,255,255,0.4)",
                                        }}>
                                            {srv.quality}
                                        </span>
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
