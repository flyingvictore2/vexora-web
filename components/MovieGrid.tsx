"use client";

import React from "react";
import Link from "next/link";
import AddToListButton from "./AddToListButton";

export interface GridMovie {
    id: string;
    title: string;
    thumbnailUrl: string;
    genre: string;
    rating: string;
    year: number;
    type: string;
    duration: string;
    communityRating?: number | null;
    ratingCount?: number;
}

interface MovieGridProps {
    movies: GridMovie[];
    emptyMessage?: string;
}

export default function MovieGrid({ movies, emptyMessage = "No se encontraron resultados." }: MovieGridProps) {
    if (!movies || movies.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.4)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
                <p style={{ fontSize: "1rem", fontWeight: "600" }}>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "20px",
        }}>
            {movies.map(movie => {
                const href = (movie.type === "SERIE" || movie.type === "ANIME" || movie.type === "SERIES")
                    ? `/title/${movie.id}`
                    : `/title/${movie.id}`;
                return (
                    <div
                        key={movie.id}
                        style={{ position: "relative", borderRadius: "10px", overflow: "hidden", backgroundColor: "#111", cursor: "pointer" }}
                        className="movie-card"
                    >
                        <Link href={href} style={{ display: "block", textDecoration: "none" }}>
                            <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
                                <img
                                    src={movie.thumbnailUrl}
                                    alt={movie.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                                />
                                <div style={{
                                    position: "absolute", inset: 0,
                                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%)",
                                    pointerEvents: "none",
                                }} />
                                {movie.communityRating != null && (
                                    <div style={{
                                        position: "absolute", top: "8px", left: "8px",
                                        backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "6px",
                                        padding: "3px 8px", fontSize: "0.72rem", fontWeight: "700", color: "#fbbf24",
                                    }}>
                                        ★ {movie.communityRating.toFixed(1)}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: "10px 10px 4px" }}>
                                <p style={{ color: "white", fontWeight: "700", fontSize: "0.85rem", margin: 0, lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {movie.title}
                                </p>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "4px 0 0", display: "flex", gap: "8px" }}>
                                    <span>{movie.year}</span>
                                    {movie.genre && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{movie.genre}</span>}
                                </p>
                            </div>
                        </Link>
                        <div style={{ padding: "6px 10px 10px", display: "flex", justifyContent: "flex-end" }}>
                            <AddToListButton movieId={movie.id} minimal />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
