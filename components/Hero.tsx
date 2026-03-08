"use client";

import React from "react";
import styles from "./Hero.module.css";

import Link from "next/link";
import AddToListButton from "./AddToListButton";

export default function Hero({ movie }: { movie?: any }) {
    if (!movie) return null;

    return (
        <header
            className={styles.hero}
            style={{
                backgroundImage: `url("${movie.thumbnailUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
            }}
        >
            <div className={styles.fadeBottom}></div>
            <div className={styles.content}>
                <h1 className={styles.title}>{movie.title}</h1>
                <div className={styles.buttons}>
                    <Link href={`/watch/${movie.id}`}>
                        <button className="btn btn-primary">▶ Play</button>
                    </Link>
                    <Link href={`/title/${movie.id}`}>
                        <button className="btn btn-secondary">ℹ More Info</button>
                    </Link>
                    <AddToListButton movieId={movie.id} minimal={true} />
                </div>
                <p className={styles.description}>
                    {movie.description}
                </p>
            </div>
        </header>
    );
}
