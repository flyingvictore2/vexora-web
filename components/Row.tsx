"use client";

import React from "react";
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
}

interface RowProps {
    title: string;
    movies: Movie[];
    isLargeRow?: boolean;
}

export default function Row({ title, movies, isLargeRow }: RowProps) {
    if (!movies || movies.length === 0) return null;

    const featuredMovie = movies[0];
    const otherMovies = movies.slice(1);

    return (
        <div className={styles.row}>
            <h2 className={styles.rowTitle}>{title}</h2>

            {/* Featured Horizontal Card */}
            <div className={styles.featuredCard}>
                <div className={styles.featuredPosterWrapper}>
                    <img
                        src={featuredMovie.thumbnailUrl}
                        alt={featuredMovie.title}
                        className={styles.featuredPosterImg}
                    />
                    <div className={styles.badge}>★ {featuredMovie.rating || 'N/A'}</div>
                </div>
                <div className={styles.featuredInfo}>
                    <h3 className={styles.featuredTitle}>{featuredMovie.title}</h3>
                    <div className={styles.stars}>
                        {'★★★★★'.split('').map((s, i) => (
                            <span key={i} style={{ color: i < 4 ? '#eab308' : '#4b5563' }}>★</span>
                        ))}
                        <span className={styles.ratingNumber}>{featuredMovie.rating}</span>
                    </div>
                    <p className={styles.featuredDesc}>{featuredMovie.description}</p>
                    <div className={styles.actions}>
                        {(featuredMovie.type === "SERIE" || featuredMovie.type === "ANIME") ? (
                            <Link href={`/series/${featuredMovie.id}`} className="btn btn-primary">
                                <span>📺</span> VER EPISODIOS
                            </Link>
                        ) : (
                            <Link href={`/watch/${featuredMovie.id}`} className="btn btn-primary">
                                <span>▶</span> VER AHORA
                            </Link>
                        )}
                        <Link href={`/title/${featuredMovie.id}`} className="btn btn-secondary">
                            VER TRAILER
                        </Link>
                    </div>
                </div>
            </div>

            {/* Grid of other posters */}
            <div className={styles.posters}>
                {otherMovies.map((movie) => (
                    <Link
                        key={movie.id}
                        href={(movie.type === "SERIE" || movie.type === "ANIME") ? `/series/${movie.id}` : `/title/${movie.id}`}
                        className={styles.posterWrapper}
                    >
                        <div className={styles.miniBadge}>★ {movie.rating}</div>
                        <img
                            className={styles.poster}
                            src={movie.thumbnailUrl}
                            alt={movie.title}
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}
