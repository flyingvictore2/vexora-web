"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface MovieItem {
    id: string; title: string; thumbnailUrl: string;
    genre: string; rating: string; year: number; type: string;
}
interface SharedList {
    id: string; name: string; ownerName: string;
    items: { movieId: string; movie: MovieItem }[];
}

export default function SharedListPage() {
    const { id } = useParams<{ id: string }>();
    const [list, setList] = useState<SharedList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/lists/${id}/view`)
            .then(r => r.json())
            .then(d => { if (d.error) setError(d.error); else setList(d); })
            .catch(() => setError("Error al cargar la lista"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ padding: "6rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            Cargando lista...
        </div>
    );

    if (error || !list) return (
        <div style={{ padding: "6rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😕</div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>{error || "Lista no encontrada"}</p>
            <Link href="/list" style={{ color: "#6366f1", fontWeight: "700", marginTop: "1rem", display: "inline-block" }}>
                ← Mis listas
            </Link>
        </div>
    );

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <Link href="/list" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
                    ← Mis listas
                </Link>
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "900", margin: 0 }}>
                            📋 {list.name}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem", marginTop: "6px" }}>
                            Lista de <span style={{ color: "white", fontWeight: "700" }}>{list.ownerName}</span>
                            {" · "}{list.items.length} {list.items.length === 1 ? "título" : "títulos"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items */}
            {list.items.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                    Esta lista está vacía.
                </div>
            ) : (
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {list.items.map(item => {
                        const href = item.movie.type === "SERIE" || item.movie.type === "ANIME"
                            ? `/series/${item.movie.id}`
                            : `/title/${item.movie.id}`;
                        return (
                            <Link key={item.movieId} href={href} style={{ textDecoration: "none", width: "160px", flexShrink: 0 }}>
                                <div style={{ borderRadius: "10px", overflow: "hidden", background: "#111", transition: "transform 0.2s" }}
                                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.03)")}
                                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                    <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
                                        <img src={item.movie.thumbnailUrl} alt={item.movie.title}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)", pointerEvents: "none" }} />
                                        {item.movie.rating && (
                                            <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.7)", borderRadius: 5, padding: "2px 7px", fontSize: "0.7rem", fontWeight: "700", color: "#fbbf24" }}>
                                                ★ {item.movie.rating}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: "8px 10px 10px" }}>
                                        <p style={{ color: "white", fontWeight: "700", fontSize: "0.82rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {item.movie.title}
                                        </p>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", margin: "3px 0 0" }}>
                                            {item.movie.year} · {item.movie.genre}
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
