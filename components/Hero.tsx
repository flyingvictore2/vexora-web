"use client";

import React from "react";
import styles from "./Hero.module.css";
import Link from "next/link";
import AddToListButton from "./AddToListButton";

export default function Hero({ movie }: { movie?: any }) {
    if (!movie) return null;

    const watchHref = (movie.type === "SERIE" || movie.type === "ANIME")
        ? `/series/${movie.id}`
        : `/watch/${movie.id}`;

    return (
        <header
            className={styles.hero}
            style={{
                backgroundImage: `url("${movie.thumbnailUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
            }}
        >
            <div className={styles.fadeLeft} />
            <div className={styles.fadeBottom} />
            <div className={styles.content}>
                <h1 className={styles.title}>{movie.title}</h1>
                <p className={styles.description}>{movie.description}</p>
                <div className={styles.buttons}>
                    <Link href={watchHref}>
                        <button className="btn btn-primary">▶ Reproducir</button>
                    </Link>
                    <Link href={`/title/${movie.id}`}>
                        <button className="btn btn-secondary">ℹ Más info</button>
                    </Link>
                    <AddToListButton movieId={movie.id} minimal={true} />
                </div>
            </div>
        </header>
    );
}
