"use client";

import React, { useState } from "react";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";

interface Server { id: string; name: string; quality: string; href: string; }
interface Episode {
    id: string; title: string; episodeNumber: number;
    seasonNumber: number; thumbnailUrl: string | null; description: string;
}

interface Props {
    servers: Server[];
    isSeriesOrAnime: boolean;
    episodes: Episode[];
    movieId?: string;
}

function qualityStyle(q: string) {
    const u = q.toUpperCase();
    if (u.includes("4K"))   return { bg: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "rgba(139,92,246,0.4)" };
    if (u.includes("1080")) return { bg: "rgba(37,99,235,0.2)",  color: "#60a5fa", border: "rgba(37,99,235,0.4)" };
    if (u.includes("720"))  return { bg: "rgba(16,185,129,0.2)", color: "#34d399", border: "rgba(16,185,129,0.4)" };
    return                         { bg: "rgba(234,179,8,0.2)",  color: "#fbbf24", border: "rgba(234,179,8,0.4)" };
}

export default function TitleTabs({ servers, isSeriesOrAnime, episodes, movieId }: Props) {
    const markSeasonWatched = async (seasonNumber: number) => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId || !movieId) return;
        await fetch("/api/watchhistory/season", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, movieId, seasonNumber, mark: true }),
        });
        alert(`Temporada ${seasonNumber} marcada como vista`);
    };

    const defaultTab = isSeriesOrAnime ? "episodios" : "enlaces";
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
    const [selectedSeason, setSelectedSeason] = useState<number>(seasonNumbers[0] ?? 1);

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
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {seasonNumbers.length === 0 ? (
                        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "3rem", fontSize: "0.9rem" }}>
                            No hay episodios disponibles todavía
                        </div>
                    ) : (
                        <>
                            {/* Season selector row */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                                {/* Dropdown */}
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() => setDropdownOpen(o => !o)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "8px",
                                            padding: "7px 16px",
                                            background: "rgba(37,99,235,0.15)",
                                            border: "1px solid rgba(37,99,235,0.35)",
                                            borderRadius: "8px", cursor: "pointer",
                                            color: "#60a5fa", fontWeight: "800",
                                            fontSize: "0.78rem", textTransform: "uppercase",
                                            letterSpacing: "0.5px", transition: "all 0.2s",
                                        }}
                                    >
                                        Temporada {selectedSeason}
                                        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                            <path d="M2 4l4 4 4-4" stroke="#60a5fa" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>

                                    {dropdownOpen && (
                                        <>
                                            {/* Backdrop to close */}
                                            <div
                                                onClick={() => setDropdownOpen(false)}
                                                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                                            />
                                            <div style={{
                                                position: "absolute", top: "calc(100% + 6px)", left: 0,
                                                minWidth: "180px", zIndex: 20,
                                                background: "#0f1117",
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                borderRadius: "10px",
                                                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                                                overflow: "hidden",
                                            }}>
                                                {seasonNumbers.map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => { setSelectedSeason(num); setDropdownOpen(false); }}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: "10px",
                                                            width: "100%", padding: "11px 16px",
                                                            background: num === selectedSeason ? "rgba(37,99,235,0.2)" : "transparent",
                                                            border: "none", cursor: "pointer",
                                                            color: num === selectedSeason ? "#60a5fa" : "rgba(255,255,255,0.75)",
                                                            fontWeight: num === selectedSeason ? "800" : "600",
                                                            fontSize: "0.85rem", textAlign: "left",
                                                            borderBottom: num !== seasonNumbers[seasonNumbers.length - 1] ? "1px solid rgba(255,255,255,0.05)" : "none",
                                                            transition: "background 0.15s",
                                                        }}
                                                        onMouseEnter={e => { if (num !== selectedSeason) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                                                        onMouseLeave={e => { if (num !== selectedSeason) e.currentTarget.style.background = "transparent"; }}
                                                    >
                                                        {num === selectedSeason && (
                                                            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        )}
                                                        {num !== selectedSeason && <span style={{ width: "14px" }} />}
                                                        Temporada {num}
                                                        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>
                                                            {seasons[num].length} ep.
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Mark season watched */}
                                <button
                                    onClick={() => markSeasonWatched(selectedSeason)}
                                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", padding: "7px 14px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "800", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }}
                                >
                                    ✓ Marcar como vista
                                </button>

                                <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                            </div>

                            {/* Episodes for selected season */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {(seasons[selectedSeason] ?? []).map(ep => (
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
                                            <div onClick={e => e.preventDefault()} style={{ marginTop: "6px" }}>
                                                <RatingStars episodeId={ep.id} size="sm" />
                                            </div>
                                        </div>
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem", flexShrink: 0 }}>›</span>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
