"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "@/components/Row.module.css";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await axios.get(`/api/movies?query=${query}`);
                // Since our /api/movies might not support query yet, we'll fetch all and filter client-side for now
                // if the API doesn't support it, but better to have it working.
                setResults(res.data.filter((m: any) =>
                    m.title.toLowerCase().includes(query.toLowerCase()) ||
                    m.genre.toLowerCase().includes(query.toLowerCase())
                ));
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div style={{ paddingBottom: "2rem" }}>

            <div style={{ marginBottom: "3rem" }}>
                <input
                    type="text"
                    placeholder="Busca por título, género o año..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "1.5rem",
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontSize: "1.3rem",
                        borderRadius: "12px",
                        outline: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ color: "#94a3b8", textAlign: 'center', padding: '4rem' }}>Buscando...</div>
            ) : (
                <>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem", color: 'white' }}>
                        {query ? `Resultados para "${query}"` : "Explora nuestro contenido"}
                    </h2>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "1.5rem"
                    }}>
                        {results.map((movie: any) => (
                            <Link key={movie.id} href={`/title/${movie.id}`} className={styles.posterWrapper}>
                                {movie.communityRating != null && <div className={styles.miniBadge}>★ {Number(movie.communityRating).toFixed(1)}</div>}
                                <img
                                    src={movie.thumbnailUrl}
                                    alt={movie.title}
                                    className={styles.poster}
                                />
                                <p style={{ marginTop: "10px", color: "white", fontWeight: '600', fontSize: '0.9rem' }}>{movie.title}</p>
                            </Link>
                        ))}
                    </div>

                    {query && results.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                            No hemos encontrado nada para "{query}". Prueba con otra cosa.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
