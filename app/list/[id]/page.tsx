"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AddToListButton from "@/components/AddToListButton";

interface MovieItem {
    id: string; title: string; thumbnailUrl: string;
    genre: string; rating: string; year: number; type: string;
}
interface ListDetail {
    id: string; name: string; ownerName: string;
    items: { movieId: string; movie: MovieItem }[];
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ listId, listName, onClose }: { listId: string; listName: string; onClose: () => void }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sent, setSent] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch("/api/social/friends").then(r => r.json())
            .then(d => setFriends(d.friends || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const share = async (friend: any) => {
        const url = `${window.location.origin}/list/shared/${listId}`;
        await fetch("/api/social/messages", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toUserId: friend.userId, content: `📋 Te compartí mi lista **${listName}**: ${url}` }),
        });
        setSent(prev => ({ ...prev, [friend.userId]: true }));
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
            onClick={onClose}>
            <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                        <h2 style={{ color: "white", fontWeight: "900", fontSize: "1.1rem", margin: 0 }}>Compartir lista</h2>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "3px" }}>📋 {listName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                    {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "1.5rem 0" }}>Cargando...</p>
                        : friends.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem" }}>No tienes amigos aún.</p>
                                <a href="/social/friends" style={{ color: "#6366f1", fontSize: "0.82rem", fontWeight: "700" }}>Añadir amigos →</a>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {friends.map(f => (
                                    <div key={f.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.85rem", color: "white", flexShrink: 0 }}>
                                                {(f.name || f.username || f.email)?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <span style={{ color: "white", fontWeight: "600", fontSize: "0.88rem" }}>{f.name || f.username || f.email}</span>
                                        </div>
                                        <button onClick={() => !sent[f.userId] && share(f)}
                                            style={{ padding: "5px 12px", borderRadius: "7px", fontSize: "0.76rem", fontWeight: "800", cursor: sent[f.userId] ? "default" : "pointer", border: "none", background: sent[f.userId] ? "rgba(16,185,129,0.15)" : "#6366f1", color: sent[f.userId] ? "#10b981" : "white" }}>
                                            {sent[f.userId] ? "✓ Enviado" : "Enviar"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

// ── Detail page ───────────────────────────────────────────────────────────────
export default function ListDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [list, setList] = useState<ListDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [socialVisible, setSocialVisible] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch(`/api/lists/${id}/view`).then(r => r.json()),
            fetch("/api/config").then(r => r.json()).catch(() => ({})),
        ]).then(([data, cfg]) => {
            if (data.error) setError(data.error);
            else setList(data);
            setSocialVisible(cfg?.sections?.social === "visible");
        }).catch(() => setError("Error al cargar"))
          .finally(() => setLoading(false));
    }, [id]);

    const removeMovie = async (movieId: string) => {
        setRemoving(movieId);
        await fetch(`/api/lists/${id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movieId }),
        });
        setList(prev => prev ? { ...prev, items: prev.items.filter(i => i.movieId !== movieId) } : prev);
        setRemoving(null);
    };

    if (loading) return <div style={{ padding: "6rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando...</div>;
    if (error || !list) return (
        <div style={{ padding: "6rem", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>{error || "Lista no encontrada"}</p>
            <Link href="/list" style={{ color: "#6366f1", fontWeight: "700", marginTop: "1rem", display: "inline-block" }}>← Mis listas</Link>
        </div>
    );

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            {sharing && <ShareModal listId={id} listName={list.name} onClose={() => setSharing(false)} />}

            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <button onClick={() => router.push("/list")}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600", padding: 0, marginBottom: "14px" }}>
                    ← Mis listas
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "900", margin: 0 }}>📋 {list.name}</h1>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "6px" }}>
                            {list.items.length} {list.items.length === 1 ? "título" : "títulos"}
                        </p>
                    </div>
                    {socialVisible && (
                        <button onClick={() => setSharing(true)}
                            style={{ padding: "9px 18px", borderRadius: "10px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", fontWeight: "800", fontSize: "0.85rem", cursor: "pointer" }}>
                            🔗 Compartir
                        </button>
                    )}
                </div>
            </div>

            {/* Movies grid */}
            {list.items.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎬</div>
                    <p>Esta lista está vacía.</p>
                    <p style={{ fontSize: "0.82rem", marginTop: "6px", opacity: 0.7 }}>Añade películas o series desde su página de detalle.</p>
                </div>
            ) : (
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {list.items.map(item => {
                        const href = item.movie.type === "SERIE" || item.movie.type === "ANIME"
                            ? `/series/${item.movie.id}` : `/title/${item.movie.id}`;
                        return (
                            <div key={item.movieId} style={{ position: "relative", width: "160px", flexShrink: 0 }}>
                                <Link href={href} style={{ textDecoration: "none" }}>
                                    <div style={{ borderRadius: "10px", overflow: "hidden", background: "#111", transition: "transform 0.2s" }}
                                        onMouseOver={e => (e.currentTarget.style.transform = "scale(1.03)")}
                                        onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}>
                                        <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
                                            <img src={item.movie.thumbnailUrl} alt={item.movie.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 60%)", pointerEvents: "none" }} />
                                            {item.movie.rating && (
                                                <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.7)", borderRadius: 5, padding: "2px 7px", fontSize: "0.7rem", fontWeight: "700", color: "#fbbf24" }}>
                                                    ★ {item.movie.rating}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: "8px 10px 10px" }}>
                                            <p style={{ color: "white", fontWeight: "700", fontSize: "0.82rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.movie.title}</p>
                                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", margin: "3px 0 0" }}>{item.movie.year}</p>
                                        </div>
                                    </div>
                                </Link>
                                {/* Remove button */}
                                <button onClick={() => removeMovie(item.movieId)} disabled={removing === item.movieId}
                                    title="Quitar de la lista"
                                    style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", opacity: removing === item.movieId ? 0.4 : 1 }}
                                    onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.8)"; e.currentTarget.style.color = "white"; }}
                                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,0,0,0.75)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                                    ✕
                                </button>
                                <div style={{ marginTop: "4px" }}>
                                    <AddToListButton movieId={item.movie.id} minimal />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
