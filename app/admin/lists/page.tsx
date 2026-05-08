"use client";

import React, { useEffect, useState } from "react";

interface FeaturedList {
    id: string; name: string; createdAt: string;
    items: { movieId: string; title: string; thumbnailUrl: string }[];
}
interface Movie { id: string; title: string; thumbnailUrl: string; type: string; }

export default function AdminListsPage() {
    const [lists, setLists] = useState<FeaturedList[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState<Record<string, string>>({});
    const [adding, setAdding] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmDel, setConfirmDel] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/lists").then(r => r.json()),
            fetch("/api/movies").then(r => r.json()),
        ]).then(([l, m]) => {
            setLists(Array.isArray(l) ? l : []);
            setMovies(Array.isArray(m) ? m : []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const createList = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/admin/lists", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (data.error) { showToast(data.error); return; }
            setLists(prev => [{ ...data, items: [] }, ...prev]);
            setNewName("");
            showToast("✅ Lista creada");
        } finally { setCreating(false); }
    };

    const deleteList = async (id: string) => {
        if (confirmDel !== id) { setConfirmDel(id); return; }
        setConfirmDel(null);
        await fetch("/api/admin/lists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        setLists(prev => prev.filter(l => l.id !== id));
        showToast("Lista eliminada");
    };

    const addMovie = async (listId: string, movieId: string) => {
        setAdding(listId + movieId);
        await fetch(`/api/admin/lists/${listId}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movieId }),
        });
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
            setLists(prev => prev.map(l => l.id === listId
                ? { ...l, items: [...l.items.filter(i => i.movieId !== movieId), { movieId, title: movie.title, thumbnailUrl: movie.thumbnailUrl }] }
                : l));
        }
        setAdding(null);
        setSearch(prev => ({ ...prev, [listId]: "" }));
    };

    const removeMovie = async (listId: string, movieId: string) => {
        await fetch(`/api/admin/lists/${listId}`, {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ movieId }),
        });
        setLists(prev => prev.map(l => l.id === listId
            ? { ...l, items: l.items.filter(i => i.movieId !== movieId) }
            : l));
    };

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Cargando...</div>;

    return (
        <div style={{ maxWidth: "1000px" }}>
            {toast && (
                <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 9999, padding: "14px 22px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: "700", backdropFilter: "blur(10px)" }}>
                    {toast}
                </div>
            )}

            <header style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2.2rem", fontWeight: "900", letterSpacing: "-1px", marginBottom: "0.4rem" }}>Listas Públicas</h1>
                <p style={{ color: "var(--text-secondary)" }}>Crea listas curadas que aparecen para todos los usuarios en la sección de Listas.</p>
            </header>

            {/* Create */}
            <div className="glass-card" style={{ padding: "20px 24px", marginBottom: "2rem", display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createList()}
                    placeholder="Nombre de la nueva lista pública..."
                    style={{ flex: 1, padding: "11px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", fontSize: "0.95rem" }}
                />
                <button onClick={createList} disabled={!newName.trim() || creating}
                    style={{ padding: "11px 24px", borderRadius: "10px", background: newName.trim() ? "#6366f1" : "rgba(255,255,255,0.05)", border: "none", color: "white", fontWeight: "800", cursor: newName.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap", opacity: creating ? 0.6 : 1 }}>
                    {creating ? "Creando..." : "+ Crear lista"}
                </button>
            </div>

            {/* Lists */}
            {lists.length === 0 ? (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
                    <p>No hay listas públicas aún. Crea la primera arriba.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {lists.map(list => {
                        const q = search[list.id] || "";
                        const filtered = movies.filter(m =>
                            m.title.toLowerCase().includes(q.toLowerCase()) &&
                            !list.items.some(i => i.movieId === m.id)
                        ).slice(0, 8);

                        return (
                            <div key={list.id} className="glass-card" style={{ padding: "22px 24px" }}>
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <h2 style={{ color: "white", fontWeight: "800", fontSize: "1.1rem", margin: 0, flex: 1 }}>
                                        📋 {list.name}
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "400", fontSize: "0.82rem", marginLeft: "8px" }}>{list.items.length} títulos</span>
                                    </h2>
                                    <button onClick={() => deleteList(list.id)} onMouseLeave={() => confirmDel === list.id && setConfirmDel(null)}
                                        style={{ padding: "5px 12px", borderRadius: "7px", fontSize: "0.75rem", fontWeight: "700", background: confirmDel === list.id ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", border: confirmDel === list.id ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)", color: confirmDel === list.id ? "#f87171" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                                        {confirmDel === list.id ? "¿Eliminar?" : "🗑️ Eliminar"}
                                    </button>
                                </div>

                                {/* Current items */}
                                {list.items.length > 0 && (
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                                        {list.items.map(item => (
                                            <div key={item.movieId} style={{ position: "relative", width: "80px", flexShrink: 0 }}>
                                                <img src={item.thumbnailUrl} alt={item.title}
                                                    style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "7px", display: "block" }} />
                                                <button onClick={() => removeMovie(list.id, item.movieId)}
                                                    title="Quitar"
                                                    style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.8)", border: "none", color: "white", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                                                    ✕
                                                </button>
                                                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.62rem", margin: "3px 0 0", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add movie */}
                                <div>
                                    <input
                                        value={q}
                                        onChange={e => setSearch(prev => ({ ...prev, [list.id]: e.target.value }))}
                                        placeholder="Buscar y añadir título..."
                                        style={{ width: "100%", padding: "9px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", fontSize: "0.85rem", boxSizing: "border-box", marginBottom: q ? "8px" : 0 }}
                                    />
                                    {q && filtered.length > 0 && (
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {filtered.map(m => (
                                                <button key={m.id} onClick={() => addMovie(list.id, m.id)}
                                                    disabled={adding === list.id + m.id}
                                                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 10px", borderRadius: "7px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "white", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" }}>
                                                    <img src={m.thumbnailUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />
                                                    {m.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {q && filtered.length === 0 && (
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Sin resultados</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
