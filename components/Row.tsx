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

export default function Row({ title, movies, isLargeRow, progressMap }: RowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

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
                            <div key={movie.id} className={`${styles.posterWrapper} trailer-host`} style={{ position: "relative" }}>
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
                                        className="trailer-iframe"
                                        src={movie.trailerUrl}
                                        allow="autoplay; encrypted-media"
                                        style={{
                                            position: "absolute", inset: 0,
                                            width: "100%", height: "100%",
                                            border: "none",
                                            pointerEvents: "none",
                                            zIndex: 5,
                                        }}
                                        loading="lazy"
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
