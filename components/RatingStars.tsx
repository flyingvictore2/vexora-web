"use client";

import React, { useEffect, useState } from "react";

interface Props {
    movieId?: string;
    episodeId?: string;
    size?: "sm" | "md" | "lg";
}

export default function RatingStars({ movieId, episodeId, size = "md" }: Props) {
    const [profileId, setProfileId] = useState<string | null>(null);
    const [userScore, setUserScore] = useState<number | null>(null);
    const [average,   setAverage]   = useState<number | null>(null);
    const [count,     setCount]     = useState(0);
    const [hover,     setHover]     = useState<number | null>(null);
    const [saving,    setSaving]    = useState(false);
    const [justRated, setJustRated] = useState(false);

    const starSize = size === "lg" ? 28 : size === "sm" ? 16 : 22;

    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        setProfileId(pid);
        const param    = movieId ? `movieId=${movieId}` : `episodeId=${episodeId}`;
        const pidParam = pid ? `&profileId=${pid}` : "";
        fetch(`/api/ratings?${param}${pidParam}`)
            .then(r => r.json())
            .then(d => { setAverage(d.average); setCount(d.count); setUserScore(d.userScore); })
            .catch(() => {});
    }, [movieId, episodeId]);

    const handleRate = async (score: number) => {
        if (!profileId || saving) return;
        setSaving(true);
        setUserScore(score);
        try {
            const res = await fetch("/api/ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId, movieId, episodeId, score }),
            });
            const data = await res.json();
            if (data.ok) {
                const param   = movieId ? `movieId=${movieId}` : `episodeId=${episodeId}`;
                const updated = await fetch(`/api/ratings?${param}&profileId=${profileId}`).then(r => r.json());
                setAverage(updated.average);
                setCount(updated.count);
                setJustRated(true);
            }
        } finally {
            setSaving(false);
        }
    };

    const displayScore = hover ?? userScore;

    // Filled bar width for average (out of 5)
    const avgPct = average !== null ? (average / 5) * 100 : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: size === "sm" ? "4px" : "10px" }}>

            {/* Stars row — user input */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map(star => {
                    const filled = displayScore !== null && star <= displayScore;
                    return (
                        <span
                            key={star}
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(null)}
                            style={{
                                fontSize: `${starSize}px`,
                                cursor: profileId ? "pointer" : "default",
                                color: filled ? "#eab308" : "rgba(255,255,255,0.2)",
                                transition: "color 0.15s, transform 0.1s",
                                transform: hover === star ? "scale(1.2)" : "scale(1)",
                                display: "inline-block",
                                lineHeight: 1,
                                userSelect: "none",
                            }}
                        >
                            ★
                        </span>
                    );
                })}
            </div>

            {/* Label */}
            {size !== "sm" && (
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: "700" }}>
                    {userScore ? `Tu valoración: ${userScore}/5` : profileId ? "Valora este contenido" : "Selecciona un perfil para valorar"}
                </div>
            )}

            {/* Community average — shown when there are ratings */}
            {average !== null && count > 0 && size !== "sm" && (
                <div style={{
                    marginTop: "4px",
                    padding: "12px 16px",
                    background: "rgba(234,179,8,0.07)",
                    border: "1px solid rgba(234,179,8,0.18)",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxWidth: "320px",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase" }}>
                            Valoración de la comunidad
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>
                            {count} {count === 1 ? "voto" : "votos"}
                        </span>
                    </div>

                    {/* Score + stars visual */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "2rem", fontWeight: "900", color: "#eab308", lineHeight: 1 }}>
                            {average.toFixed(1)}
                        </span>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                            {/* Mini stars */}
                            <div style={{ display: "flex", gap: "2px" }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} style={{ fontSize: "13px", color: s <= Math.round(average!) ? "#eab308" : "rgba(255,255,255,0.15)" }}>★</span>
                                ))}
                                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginLeft: "4px", fontWeight: "600" }}>/ 5</span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${avgPct}%`, background: "linear-gradient(90deg, #eab308, #f59e0b)", borderRadius: "2px", transition: "width 0.6s ease" }} />
                            </div>
                        </div>
                    </div>

                    {justRated && (
                        <div style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: "700" }}>
                            ✓ ¡Gracias por tu valoración!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
