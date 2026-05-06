"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Server { id: string; name: string; quality: string; href: string; }
interface Episode {
    id: string; title: string; episodeNumber: number;
    seasonNumber: number; thumbnailUrl: string | null; description: string;
}

interface Props {
    servers: Server[];
    isSeriesOrAnime: boolean;
    episodes: Episode[];
}

function qualityStyle(q: string) {
    const u = q.toUpperCase();
    if (u.includes("4K"))   return { bg: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "rgba(139,92,246,0.4)" };
    if (u.includes("1080")) return { bg: "rgba(37,99,235,0.2)",  color: "#60a5fa", border: "rgba(37,99,235,0.4)" };
    if (u.includes("720"))  return { bg: "rgba(16,185,129,0.2)", color: "#34d399", border: "rgba(16,185,129,0.4)" };
    return                         { bg: "rgba(234,179,8,0.2)",  color: "#fbbf24", border: "rgba(234,179,8,0.4)" };
}

export default function TitleTabs({ servers, isSeriesOrAnime, episodes }: Props) {
    const defaultTab = isSeriesOrAnime ? "episodios" : "enlaces";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const tabs = [
        ...(isSeriesOrAnime ? [{ id: "episodios", label: "EPISODIOS" }] : []),
        { id: "enlaces", label: "ENLACES" },
    ];

    // Group episodes by season
    const seasons: Record<number, Episode[]> = {};
    for (const ep of episodes) {
        if (!seasons[ep.seasonNumber]) seasons[ep.seasonNumber] = [];
        seasons[ep.seasonNumber].push(ep);
    }
    const seasonNumbers = Object.keys(seasons).map(Number).sort((a, b) => a - b);

    const tabBtn = (id: string, label: string) => (
        <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
                padding: "11px 22px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.8rem", fontWeight: "800", letterSpacing: "1px",
                color: activeTab === id ? "white" : "rgba(255,255,255,0.38)",
                borderBottom: activeTab === id ? "2px solid #e50914" : "2px solid transparent",
                marginBottom: "-2px", transition: "color 0.2s",
            }}
        >{label}</button>
    );

    return (
        <div style={{ marginTop: "1.5rem" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "2px solid rgba(255,255,255,0.07)", marginBottom: "1.25rem" }}>
                {tabs.map(t => tabBtn(t.id, t.label))}
            </div>

            {/* ── ENLACES ── */}
            {activeTab === "enlaces" && (
                <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {servers.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                            No hay servidores disponibles todavía
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    {["SERVIDOR", "CALIDAD", "REPRODUCIR"].map(h => (
                                        <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: "0.68rem", fontWeight: "800", color: "rgba(255,255,255,0.3)", letterSpacing: "1.2px" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {servers.map((srv, i) => {
                                    const qc = qualityStyle(srv.quality);
                                    return (
                                        <tr
                                            key={srv.id}
                                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}
                                        >
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ fontWeight: "700", color: "white", fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    {srv.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "800", backgroundColor: qc.bg, color: qc.color, border: `1px solid ${qc.border}` }}>
                                                    {srv.quality}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 18px" }}>
                                                <Link href={srv.href} style={{
                                                    display: "inline-flex", alignItems: "center", gap: "6px",
                                                    padding: "7px 18px", backgroundColor: "#e50914",
                                                    color: "white", textDecoration: "none",
                                                    borderRadius: "6px", fontWeight: "800",
                                                    fontSize: "0.78rem", letterSpacing: "0.5px",
                                                    transition: "opacity 0.15s",
                                                }}>
                                                    ▶ REPRODUCIR
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── EPISODIOS ── */}
            {activeTab === "episodios" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {seasonNumbers.length === 0 && (
                        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "3rem", fontSize: "0.9rem" }}>
                            No hay episodios disponibles todavía
                        </div>
                    )}
                    {seasonNumbers.map(seasonNum => (
                        <div key={seasonNum}>
                            {seasonNumbers.length > 1 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                                    <span style={{ padding: "4px 14px", borderRadius: "8px", backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)", color: "#60a5fa", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase" }}>
                                        Temporada {seasonNum}
                                    </span>
                                    <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                                </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {seasons[seasonNum].map(ep => (
                                    <Link key={ep.id} href={`/watch/episode/${ep.id}`} className="ep-row" style={{
                                        textDecoration: "none", display: "flex", alignItems: "center", gap: "16px",
                                        padding: "14px 20px", backgroundColor: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", transition: "all 0.2s",
                                    }}>
                                        {ep.thumbnailUrl && (
                                            <div style={{ width: "120px", height: "68px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, backgroundColor: "#1e293b" }}>
                                                <img src={ep.thumbnailUrl} alt={ep.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                        )}
                                        <div style={{ width: "36px", flexShrink: 0, textAlign: "center", fontSize: "1.1rem", fontWeight: "900", color: "rgba(255,255,255,0.25)" }}>
                                            {ep.episodeNumber}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: "700", color: "white", fontSize: "0.95rem", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {ep.title}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as any}>
                                                {ep.description || "Sin descripción"}
                                            </div>
                                        </div>
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem", flexShrink: 0 }}>›</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
