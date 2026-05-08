"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MovieItem {
    id: string; title: string; thumbnailUrl: string;
    genre: string; rating: string; year: number; type: string;
}
interface UserList {
    id: string; name: string;
    items: { movieId: string; movie: MovieItem }[];
    createdAt: string;
}

// ── Thumbnail collage ─────────────────────────────────────────────────────────
function Collage({ items }: { items: UserList["items"] }) {
    const thumbs = items.slice(0, 5).map(i => i.movie?.thumbnailUrl).filter(Boolean);
    if (thumbs.length === 0) return (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1e2a40,#0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.8rem" }}>
            📋
        </div>
    );
    return (
        <div style={{ display: "flex", height: "100%", gap: "2px", overflow: "hidden" }}>
            {thumbs.map((t, i) => (
                <img key={i} src={t} alt="" style={{ flex: `0 0 ${100 / thumbs.length}%`, height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            ))}
        </div>
    );
}

// ── Create list modal ─────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => Promise<void> }) {
    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const submit = async () => {
        if (!name.trim()) return;
        setCreating(true); setErr(null);
        try { await onCreate(name.trim()); onClose(); }
        catch (e: any) { setErr(e.message || "Error al crear"); }
        finally { setCreating(false); }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}
            onClick={onClose}>
            <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "400px" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h2 style={{ color: "white", fontWeight: "900", fontSize: "1.2rem", margin: 0 }}>Nueva lista</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1.3rem", cursor: "pointer" }}>✕</button>
                </div>
                <input
                    autoFocus
                    value={name}
                    onChange={e => { setName(e.target.value); setErr(null); }}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    placeholder="Nombre de la lista..."
                    style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.95rem", background: "rgba(255,255,255,0.07)", border: err ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)", color: "white", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
                />
                {err && <p style={{ color: "#f87171", fontSize: "0.82rem", margin: "0 0 12px" }}>⚠️ {err}</p>}
                <button onClick={submit} disabled={!name.trim() || creating}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", fontWeight: "800", fontSize: "0.95rem", background: name.trim() ? "#6366f1" : "rgba(255,255,255,0.06)", color: name.trim() ? "white" : "rgba(255,255,255,0.3)", border: "none", cursor: name.trim() ? "pointer" : "not-allowed", opacity: creating ? 0.7 : 1 }}>
                    {creating ? "Creando..." : "Crear lista"}
                </button>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyListsPage() {
    const [lists, setLists] = useState<UserList[]>([]);
    const [featuredLists, setFeaturedLists] = useState<UserList[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDel, setConfirmDel] = useState<string | null>(null);

    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        setProfileId(pid);
        const userListsPromise = pid
            ? fetch(`/api/lists?profileId=${pid}`).then(r => r.json()).catch(() => [])
            : Promise.resolve([]);
        Promise.all([
            userListsPromise,
            fetch("/api/public-lists").then(r => r.json()).catch(() => []),
        ]).then(([ul, fl]) => {
            setLists(Array.isArray(ul) ? ul : []);
            setFeaturedLists(Array.isArray(fl) ? fl : []);
        }).finally(() => setLoading(false));
    }, []);

    const createList = async (name: string) => {
        if (!profileId) throw new Error("No hay perfil activo");
        const res = await fetch("/api/lists", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, name }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Error");
        // reload
        const updated = await fetch(`/api/lists?profileId=${profileId}`).then(r => r.json());
        setLists(Array.isArray(updated) ? updated : []);
    };

    const deleteList = async (id: string) => {
        if (confirmDel !== id) { setConfirmDel(id); return; }
        setDeleting(id); setConfirmDel(null);
        await fetch(`/api/lists/${id}`, { method: "DELETE" });
        setLists(prev => prev.filter(l => l.id !== id));
        setDeleting(null);
    };

    const filtered = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return (
        <div style={{ padding: "8rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando listas...</div>
    );

    return (
        <div style={{ padding: "2rem 4% 4rem" }}>
            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createList} />}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "2rem", flexWrap: "wrap" }}>
                <h1 style={{ color: "white", fontSize: "2rem", fontWeight: "900", margin: 0 }}>Mis Listas</h1>
                <div style={{ flex: 1, minWidth: "180px" }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar lista..."
                        style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", fontSize: "0.88rem", boxSizing: "border-box" }}
                    />
                </div>
                <button onClick={() => setShowCreate(true)}
                    style={{ padding: "10px 22px", borderRadius: "10px", background: "#6366f1", border: "none", color: "white", fontWeight: "800", fontSize: "0.88rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                    + Crear lista
                </button>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "5rem 0", color: "rgba(255,255,255,0.3)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
                    <h2 style={{ color: "white", marginBottom: "0.5rem" }}>
                        {search ? "No se encontraron listas" : "Aún no tienes listas"}
                    </h2>
                    {!search && (
                        <button onClick={() => setShowCreate(true)}
                            style={{ marginTop: "1rem", padding: "10px 24px", borderRadius: "10px", background: "#6366f1", border: "none", color: "white", fontWeight: "800", cursor: "pointer" }}>
                            Crear mi primera lista
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                    {filtered.map(list => (
                        <div key={list.id} style={{ borderRadius: "14px", overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.2s, border-color 0.2s" }}
                            onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>

                            {/* Cover */}
                            <Link href={`/list/${list.id}`} style={{ display: "block", aspectRatio: "16/9", overflow: "hidden", textDecoration: "none" }}>
                                <Collage items={list.items} />
                            </Link>

                            {/* Info */}
                            <div style={{ padding: "14px 16px" }}>
                                <Link href={`/list/${list.id}`} style={{ textDecoration: "none" }}>
                                    <h3 style={{ color: "white", fontWeight: "800", fontSize: "1rem", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{list.name}</h3>
                                </Link>
                                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", margin: 0 }}>
                                    {list.items.length} {list.items.length === 1 ? "título" : "títulos"}
                                </p>
                                <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                                    <Link href={`/list/${list.id}`}
                                        style={{ padding: "6px 12px", borderRadius: "7px", fontSize: "0.75rem", fontWeight: "700", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", textDecoration: "none" }}>
                                        Abrir
                                    </Link>
                                    <button
                                        onClick={() => deleteList(list.id)}
                                        disabled={deleting === list.id}
                                        onMouseLeave={() => confirmDel === list.id && setConfirmDel(null)}
                                        style={{ padding: "6px 12px", borderRadius: "7px", fontSize: "0.75rem", fontWeight: "700", background: confirmDel === list.id ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", border: confirmDel === list.id ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)", color: confirmDel === list.id ? "#f87171" : "rgba(255,255,255,0.35)", cursor: "pointer", opacity: deleting === list.id ? 0.5 : 1 }}>
                                        {deleting === list.id ? "..." : confirmDel === list.id ? "¿Seguro?" : "🗑️"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Featured / public lists */}
            {featuredLists.length > 0 && (
                <div style={{ marginTop: "4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                        <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: "900", margin: 0 }}>✨ Listas destacadas</h2>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>Curadas por el equipo</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {featuredLists.map(list => (
                            <div key={list.id} style={{ borderRadius: "14px", overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)", transition: "transform 0.2s, border-color 0.2s" }}
                                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.15)"; }}>
                                <Link href={`/list/shared/${list.id}`} style={{ display: "block", aspectRatio: "16/9", overflow: "hidden", textDecoration: "none" }}>
                                    <Collage items={list.items} />
                                </Link>
                                <div style={{ padding: "14px 16px" }}>
                                    <Link href={`/list/shared/${list.id}`} style={{ textDecoration: "none" }}>
                                        <h3 style={{ color: "white", fontWeight: "800", fontSize: "1rem", margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{list.name}</h3>
                                    </Link>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "0.7rem", background: "rgba(99,102,241,0.15)", color: "#818cf8", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>DESTACADA</span>
                                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>{list.items.length} títulos</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
