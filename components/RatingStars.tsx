"use client";

import React, { useEffect, useState } from "react";

interface Props {
    movieId?: string;
    episodeId?: string;
    size?: "sm" | "md" | "lg";
}

export default function RatingStars({ movieId, episodeId, size = "md" }: Props) {
    const [profileId, setProfileId] = useState<string | null>(null);
    const [userScore, setUserScore]   = useState<number | null>(null);
    const [average,   setAverage]     = useState<number | null>(null);
    const [count,     setCount]       = useState(0);
    const [hover,     setHover]       = useState<number | null>(null);
    const [saving,    setSaving]      = useState(false);

    const starSize = size === "lg" ? 28 : size === "sm" ? 16 : 22;

    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        setProfileId(pid);

        const param = movieId ? `movieId=${movieId}` : `episodeId=${episodeId}`;
        const pidParam = pid ? `&profileId=${pid}` : "";

        fetch(`/api/ratings?${param}${pidParam}`)
            .then(r => r.json())
            .then(d => {
                setAverage(d.average);
                setCount(d.count);
                setUserScore(d.userScore);
            })
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
                // Refresh average
                const param = movieId ? `movieId=${movieId}` : `episodeId=${episodeId}`;
                const updated = await fetch(`/api/ratings?${param}&profileId=${profileId}`).then(r => r.json());
                setAverage(updated.average);
                setCount(updated.count);
            }
        } finally {
            setSaving(false);
        }
    };

    const displayScore = hover ?? userScore;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Stars row */}
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

                {/* Average badge */}
                {average !== null && (
                    <span style={{
                        marginLeft: "8px",
                        fontSize: size === "sm" ? "0.7rem" : "0.78rem",
                        color: "rgba(255,255,255,0.45)",
                        fontWeight: "600",
                    }}>
                        {average.toFixed(1)} <span style={{ opacity: 0.5 }}>({count})</span>
                    </span>
                )}
            </div>

            {/* Label */}
            {size !== "sm" && (
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", fontWeight: "700" }}>
                    {userScore ? `Tu valoración: ${userScore}/5` : profileId ? "Valora este contenido" : "Selecciona un perfil para valorar"}
                </div>
            )}
        </div>
    );
}
