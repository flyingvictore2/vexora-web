"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";

interface MovieItem {
    id: string;
    title: string;
    thumbnailUrl: string;
    genre: string;
    rating: string;
    year: number;
    type: string;
}

interface UserListItem {
    movieId: string;
    movie: MovieItem;
}

interface UserList {
    id: string;
    name: string;
    items: UserListItem[];
    createdAt: string;
}

function MovieCard({ movie, onRemove }: { movie: MovieItem; onRemove?: () => void }) {
    const href = `/title/${movie.id}`;
    return (
        <div style={{
            borderRadius: "10px", overflow: "hidden", backgroundColor: "#111",
            position: "relative", flexShrink: 0, width: "160px",
        }}>
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
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
                        pointerEvents: "none",
                    }} />
                    {movie.rating && (
                        <div style={{
                            position: "absolute", top: "7px", left: "7px",
                            backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "5px",
                            padding: "2px 7px", fontSize: "0.7rem", fontWeight: "700", color: "#fbbf24",
                        }}>
                            ★ {movie.rating}
                        </div>
                    )}
                </div>
                <div style={{ padding: "8px 8px 4px" }}>
                    <p style={{
                        color: "white", fontWeight: "700", fontSize: "0.82rem", margin: 0,
                        lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                        {movie.title}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", margin: "3px 0 0" }}>
                        {movie.year} · {movie.genre}
                    </p>
                </div>
            </Link>
            <div style={{ padding: "4px 8px 8px", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <AddToListButton movieId={movie.id} minimal />
            </div>
        </div>
    );
}

function UserListSection({
    list,
    onDelete,
    onMovieRemoved,
}: {
    list: UserList;
    onDelete: (id: string) => void;
    onMovieRemoved: (listId: string, movieId: string) => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        setDeleting(true);
        await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
        onDelete(list.id);
    };

    const handleRemoveMovie = async (movieId: string) => {
        await fetch(`/api/lists/${list.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movieId }),
        });
        onMovieRemoved(list.id, movieId);
    };

    return (
        <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                    📋 {list.name}
                </h2>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                    {list.items.length} {list.items.length === 1 ? "título" : "títulos"}
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    {confirmDelete && (
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", alignSelf: "center" }}>
                            ¿Seguro?
                        </span>
                    )}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            padding: "6px 12px", borderRadius: "7px", fontSize: "0.75rem", fontWeight: "700",
                            backgroundColor: confirmDelete ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.05)",
                            border: confirmDelete ? "1px solid rgba(229,9,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                            color: confirmDelete ? "#ef4444" : "rgba(255,255,255,0.4)",
                            cursor: "pointer", transition: "all 0.15s",
                            opacity: deleting ? 0.5 : 1,
                        }}
                        onMouseLeave={() => setConfirmDelete(false)}
                    >
                        {deleting ? "..." : confirmDelete ? "Confirmar" : "Eliminar lista"}
                    </button>
                </div>
            </div>

            {list.items.length === 0 ? (
                <div style={{
                    padding: "2rem", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)",
                    textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem",
                }}>
                    Esta lista está vacía. Añade contenido desde cualquier título.
                </div>
            ) : (
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {list.items.map(item => (
                        <div key={item.movieId} style={{ position: "relative" }}>
                            <MovieCard movie={item.movie} />
                            <button
                                onClick={() => handleRemoveMovie(item.movieId)}
                                title="Quitar de esta lista"
                                style={{
                                    position: "absolute", top: "6px", right: "6px",
                                    width: "24px", height: "24px", borderRadius: "50%",
                                    backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)",
                                    color: "rgba(255,255,255,0.7)", fontSize: "12px", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    lineHeight: 1, fontWeight: "700",
                                }}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = "rgba(229,9,20,0.7)"; e.currentTarget.style.color = "white"; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MyListsPage() {
    const [userLists, setUserLists] = useState<UserList[]>([]);
    const [myList, setMyList] = useState<MovieItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newListName, setNewListName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) { setLoading(false); return; }

        Promise.all([
            fetch(`/api/lists?profileId=${profileId}`).then(r => r.json()),
            fetch(`/api/mylist?profileId=${profileId}`).then(r => r.json()).catch(() => []),
        ]).then(([lists, mylist]) => {
            setUserLists(Array.isArray(lists) ? lists : []);
            setMyList(Array.isArray(mylist) ? mylist : []);
        }).finally(() => setLoading(false));
    }, []);

    const createList = async () => {
        if (!newListName.trim()) return;
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) return;
        setCreating(true);
        try {
            const res = await fetch("/api/lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId, name: newListName.trim() }),
            });
            const newList = await res.json();
            setUserLists(prev => [...prev, { ...newList, items: [] }]);
            setNewListName("");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteList = (id: string) => {
        setUserLists(prev => prev.filter(l => l.id !== id));
    };

    const handleMovieRemoved = (listId: string, movieId: string) => {
        setUserLists(prev => prev.map(l => l.id === listId
            ? { ...l, items: l.items.filter(i => i.movieId !== movieId) }
            : l
        ));
    };

    if (loading) {
        return (
            <div style={{ color: "white", padding: "8rem", textAlign: "center", fontSize: "1rem" }}>
                Cargando tus listas...
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "2.5rem", flexWrap: "wrap" }}>
                <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "800", margin: 0 }}>Mis Listas</h1>
                {/* Create new list */}
                <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                    <input
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && createList()}
                        placeholder="Nueva lista..."
                        style={{
                            padding: "9px 14px", borderRadius: "8px", fontSize: "0.85rem",
                            backgroundColor: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.12)", color: "white", outline: "none",
                            width: "200px",
                        }}
                    />
                    <button
                        onClick={createList}
                        disabled={!newListName.trim() || creating}
                        style={{
                            padding: "9px 18px", borderRadius: "8px", fontWeight: "700",
                            backgroundColor: newListName.trim() ? "#2563eb" : "rgba(255,255,255,0.05)",
                            border: "none", color: "white",
                            cursor: newListName.trim() ? "pointer" : "not-allowed",
                            fontSize: "0.85rem", transition: "all 0.2s",
                            opacity: creating ? 0.6 : 1,
                        }}
                    >
                        {creating ? "..." : "+ Crear lista"}
                    </button>
                </div>
            </div>

            {/* Custom user lists */}
            {userLists.length === 0 && myList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.35)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
                    <h2 style={{ color: "white", marginBottom: "0.5rem" }}>Aún no tienes listas</h2>
                    <p>Crea tu primera lista arriba y añade películas, series o anime desde sus páginas.</p>
                </div>
            ) : (
                <>
                    {userLists.map(list => (
                        <UserListSection
                            key={list.id}
                            list={list}
                            onDelete={handleDeleteList}
                            onMovieRemoved={handleMovieRemoved}
                        />
                    ))}

                    {/* Old quick-add list (mylist) */}
                    {myList.length > 0 && (
                        <div style={{ marginBottom: "3rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                                    ❤️ Mi Lista Rápida
                                </h2>
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                                    {myList.length} {myList.length === 1 ? "título" : "títulos"}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                                {myList.map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
