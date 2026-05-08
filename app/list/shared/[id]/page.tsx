"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Movie {
    id: string; title: string; thumbnailUrl: string;
    genre: string; rating: string; year: number; type: string;
}
interface FeaturedList {
    id: string; name: string; createdAt: string;
    items: { movieId: string; movie: Movie }[];
}

export default function SharedListPage() {
    const { id } = useParams<{ id: string }>();
    const [list, setList] = useState<FeaturedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/public-lists/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setNotFound(true); return; }
                setList(data);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ padding: "8rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
            Cargando lista...
        </div>
    );

    if (notFound || !list) return (
        <div style={{ padding: "8rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>Lista no encontrada</p>
            <Link href="/list" style={{ color: "#818cf8", textDecoration: "none", fontSize: "0.9rem" }}>← Mis listas</Link>
        </div>
    );

    return (
        <div style={{ padding: "2rem 4% 4rem", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "2.5rem" }}>
                <Link href="/list" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
                    ← Volver a listas
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "900", margin: 0 }}>{list.name}</h1>
                            <span style={{ fontSize: "0.7rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "3px 10px", borderRadius: "5px", fontWeight: "800", letterSpacing: "0.5px" }}>
                                ✨ DESTACADA
                            </span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", margin: 0 }}>
                            {list.items.length} {list.items.length === 1 ? "título" : "títulos"} · Curada por el equipo
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {list.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.3)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
                    <p>Esta lista está vacía por ahora</p>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "16px"
                }}>
                    {list.items.map(({ movieId, movie }) => {
                        const href = movie.type === "SERIE" || movie.type === "ANIME"
                            ? `/series/${movie.id}`
                            : `/title/${movie.id}`;
                        return (
                            <Link key={movieId} href={href} style={{ textDecoration: "none" }}>
                                <div
                                    style={{ borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                                >
                                    <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
                                        <img
                                            src={movie.thumbnailUrl}
                                            alt={movie.title}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                                        />
                                        {movie.rating && (
                                            <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.7)", borderRadius: 5, padding: "2px 7px", fontSize: "0.7rem", fontWeight: "700", color: "#fbbf24" }}>
                                                ★ {movie.rating}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: "10px 10px 12px" }}>
                                        <p style={{ color: "white", fontWeight: "700", fontSize: "0.82rem", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {movie.title}
                                        </p>
                                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", margin: 0 }}>
                                            {movie.year}{movie.genre ? ` · ${movie.genre}` : ""}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
