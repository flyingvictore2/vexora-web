"use client";

import React, { useRef } from "react";
import styles from "./Row.module.css";
import Link from "next/link";

export interface Movie {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    genre: string;
    rating: string;
    year: number;
    type: string;
    trailerUrl?: string | null;
}

interface RowProps {
    title: string;
    movies: Movie[];
    isLargeRow?: boolean;
    progressMap?: Record<string, number>;
}

function trailerSrc(url: string): string {
    try {
        const u = new URL(url);
        let videoId: string | null = null;

        if (u.hostname === "youtu.be") {
            videoId = u.pathname.slice(1);
        } else if (u.hostname.includes("youtube.com")) {
            if (u.pathname.startsWith("/embed/")) {
                videoId = u.pathname.split("/embed/")[1]?.split("/")[0] ?? null;
            } else {
                videoId = u.searchParams.get("v");
            }
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`;
        }

        u.searchParams.set("autoplay", "1");
        u.searchParams.set("mute", "1");
        u.searchParams.set("controls", "0");
        u.searchParams.set("loop", "1");
        u.searchParams.set("playsinline", "1");
        return u.toString();
    } catch {
        return url;
    }
}

export default function Row({ title, movies, isLargeRow, progressMap }: RowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = React.useState<string | null>(null);

    if (!movies || movies.length === 0) return null;

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const amount = direction === "left"
                ? -rowRef.current.offsetWidth * 0.75
                : rowRef.current.offsetWidth * 0.75;
            rowRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    return (
        <div className={styles.row}>
            <h2 className={styles.rowTitle}>{title}</h2>
            <div className={styles.sliderContainer}>
                <button
                    className={`${styles.arrow} ${styles.arrowLeft}`}
                    onClick={() => scroll("left")}
                    aria-label="Anterior"
                >
                    ‹
                </button>

                <div
                    className={`${styles.posters} ${isLargeRow ? styles.large : ""}`}
                    ref={rowRef}
                >
                    {movies.map((movie) => {
                        const href = (movie.type === "SERIE" || movie.type === "ANIME")
                            ? `/series/${movie.id}`
                            : `/title/${movie.id}`;
                        const pct = progressMap?.[movie.id];
                        return (
                            <div
                                key={movie.id}
                                className={styles.posterWrapper}
                                style={{ position: "relative" }}
                                onMouseEnter={() => movie.trailerUrl && setHoveredId(movie.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <Link href={href} style={{ display: "block", position: "relative" }}>
                                    <img
                                        src={movie.thumbnailUrl}
                                        alt={movie.title}
                                        className={styles.poster}
                                    />
                                    <div className={styles.overlay}>
                                        <div className={styles.playBtn}>▶</div>
                                        <p className={styles.overlayTitle}>{movie.title}</p>
                                        <div className={styles.overlayMeta}>
                                            {movie.rating && <span className={styles.rating}>★ {movie.rating}</span>}
                                            {movie.year && <span className={styles.year}>{movie.year}</span>}
                                        </div>
                                    </div>
                                    {pct !== undefined && pct > 0 && (
                                        <div style={{
                                            position: "absolute", bottom: 0, left: 0, right: 0,
                                            height: "3px", backgroundColor: "rgba(0,0,0,0.5)",
                                            borderRadius: "0 0 6px 6px",
                                            overflow: "hidden",
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pct}%`,
                                                backgroundColor: "#6366f1",
                                            }} />
                                        </div>
                                    )}
                                </Link>
                                {movie.trailerUrl && (
                                    <iframe
                                        src={hoveredId === movie.id ? trailerSrc(movie.trailerUrl) : undefined}
                                        allow="autoplay; encrypted-media; fullscreen"
                                        style={{
                                            position: "absolute", inset: 0,
                                            width: "100%", height: "100%",
                                            border: "none",
                                            borderRadius: "inherit",
                                            opacity: hoveredId === movie.id ? 1 : 0,
                                            transition: "opacity 0.35s ease 0.3s",
                                            pointerEvents: "none",
                                            zIndex: 5,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    className={`${styles.arrow} ${styles.arrowRight}`}
                    onClick={() => scroll("right")}
                    aria-label="Siguiente"
                >
                    ›
                </button>
            </div>
        </div>
    );
}
