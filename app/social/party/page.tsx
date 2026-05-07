"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function WatchPartyPage() {
    const { status } = useSession();
    const router = useRouter();
    const [movies, setMovies] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [profileId, setProfileId] = useState<string|null>(null);
    const [toast, setToast] = useState<string|null>(null);

    useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status]);
    useEffect(() => {
        setProfileId(localStorage.getItem("selectedProfileId"));
        fetch("/api/movies").then(r => r.json()).then(setMovies).catch(() => {});
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const createParty = async () => {
        if (!profileId) { showToast("Selecciona un perfil primero"); return; }
        setCreating(true);
        const res = await fetch("/api/social/party", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                profileId,
                movieId: selected?.type !== "SERIE" && selected?.type !== "ANIME" ? selected?.id : null,
                episodeId: null,
            }),
        });
        setCreating(false);
        if (!res.ok) { showToast("Error al crear sala"); return; }
        const { code } = await res.json();
        router.push(`/social/party/${code}`);
    };

    const joinParty = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        router.push(`/social/party/${joinCode.trim().toUpperCase()}`);
    };

    const filtered = movies.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
            {toast && (
                <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 9999,
                    padding: "14px 22px", borderRadius: "12px", background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontWeight: "700", backdropFilter: "blur(10px)" }}>
                    {toast}
                </div>
            )}

            <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem" }}>🎉 Watch Party</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                Ve películas y series simultáneamente con tus amigos en tiempo real.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "2rem" }}>
                {/* Join existing */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ fontWeight: "800", marginBottom: "12px", fontSize: "1rem" }}>🔗 Unirse a una sala</h3>
                    <form onSubmit={joinParty} style={{ display: "flex", gap: "8px" }}>
                        <input
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Código (ej: AB12CD)"
                            maxLength={8}
                            style={{
                                flex: 1, padding: "10px 14px",
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px", color: "white", fontSize: "0.9rem",
                                outline: "none", letterSpacing: "2px", fontWeight: "700",
                            }}
                        />
                        <button type="submit" style={{
                            padding: "10px 18px", background: "#6366f1", border: "none",
                            borderRadius: "8px", color: "white", fontWeight: "800", cursor: "pointer" }}>
                            Unirse
                        </button>
                    </form>
                </div>

                {/* Create */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ fontWeight: "800", marginBottom: "12px", fontSize: "1rem" }}>✨ Crear sala</h3>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>
                        {selected ? `Seleccionado: ${selected.title}` : "Elige un título abajo para empezar"}
                    </p>
                    <button onClick={createParty} disabled={creating} style={{
                        width: "100%", padding: "10px", background: selected ? "#6366f1" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${selected ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "8px", color: selected ? "white" : "rgba(255,255,255,0.3)",
                        fontWeight: "800", cursor: selected ? "pointer" : "not-allowed",
                        fontSize: "0.88rem",
                    }}>
                        {creating ? "Creando..." : selected ? "🎬 Crear sala" : "Selecciona un título primero"}
                    </button>
                </div>
            </div>

            {/* Movie picker */}
            <h3 style={{ fontWeight: "800", marginBottom: "12px", fontSize: "1rem" }}>🎬 Elige qué ver</h3>
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar título..."
                style={{
                    width: "100%", padding: "10px 16px", marginBottom: "12px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
                }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                {filtered.slice(0, 24).map(m => (
                    <button key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)} style={{
                        background: selected?.id === m.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selected?.id === m.id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: "10px", overflow: "hidden", cursor: "pointer",
                        padding: 0, textAlign: "left", transition: "all 0.15s",
                    }}>
                        <img src={m.thumbnailUrl} alt={m.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                        <div style={{ padding: "8px 10px" }}>
                            <div style={{ fontWeight: "700", color: "white", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{m.year}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
