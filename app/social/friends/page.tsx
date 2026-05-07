"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px", padding: "14px 18px",
    display: "flex", alignItems: "center", gap: "14px",
};
const avatar = (name: string, size = 42) => {
    const initials = (name || "?").slice(0, 2).toUpperCase();
    const colors = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#3b82f6"];
    const color = colors[(name || "?").charCodeAt(0) % colors.length];
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: size * 0.35, color: "white", flexShrink: 0 }}>
            {initials}
        </div>
    );
};

export default function FriendsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<{ friends: any[]; incoming: any[]; outgoing: any[] }>({ friends: [], incoming: [], outgoing: [] });
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [tab, setTab] = useState<"friends"|"requests"|"search">("friends");
    const [toast, setToast] = useState<string|null>(null);
    const debounce = useRef<any>(null);

    useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status]);
    useEffect(() => { fetchFriends(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const fetchFriends = async () => {
        const res = await fetch("/api/social/friends");
        if (res.ok) setData(await res.json());
    };

    useEffect(() => {
        clearTimeout(debounce.current);
        if (!search.trim() || search.length < 2) { setSearchResults([]); return; }
        debounce.current = setTimeout(async () => {
            setSearching(true);
            const res = await fetch(`/api/social/search?q=${encodeURIComponent(search)}`);
            if (res.ok) setSearchResults(await res.json());
            setSearching(false);
        }, 400);
    }, [search]);

    const sendRequest = async (toUserId: string) => {
        const res = await fetch("/api/social/friends", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toUserId }),
        });
        const json = await res.json();
        if (!res.ok) { showToast(json.error || "Error"); return; }
        showToast("✅ Solicitud enviada");
        fetchFriends();
    };

    const respond = async (requestId: string, action: "accept"|"reject") => {
        await fetch("/api/social/friends", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, action }),
        });
        showToast(action === "accept" ? "✅ Amigo añadido" : "Solicitud rechazada");
        fetchFriends();
    };

    const removeFriend = async (friendUserId: string) => {
        await fetch("/api/social/friends", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ friendUserId }),
        });
        showToast("Amigo eliminado");
        fetchFriends();
    };

    const pendingCount = data.incoming.length;

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
            {toast && (
                <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 9999,
                    padding: "14px 22px", borderRadius: "12px", background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontWeight: "700", backdropFilter: "blur(10px)" }}>
                    {toast}
                </div>
            )}

            <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "1.5rem" }}>👥 Amigos</h1>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0" }}>
                {([["friends", `Amigos (${data.friends.length})`], ["requests", `Solicitudes${pendingCount > 0 ? ` (${pendingCount})` : ""}`], ["search", "Buscar"]] as [string, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id as any)} style={{
                        padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.82rem", fontWeight: "800", letterSpacing: "0.5px",
                        color: tab === id ? "white" : "rgba(255,255,255,0.4)",
                        borderBottom: tab === id ? "2px solid #6366f1" : "2px solid transparent",
                        marginBottom: "-1px", transition: "color 0.2s",
                    }}>{label}</button>
                ))}
            </div>

            {/* Friends list */}
            {tab === "friends" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.friends.length === 0 && (
                        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                            Aún no tienes amigos. ¡Usa la pestaña Buscar para añadir!
                        </div>
                    )}
                    {data.friends.map(f => (
                        <div key={f.userId} style={card}>
                            {avatar(f.name || f.username || f.email)}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: "700", color: "white", fontSize: "0.95rem" }}>{f.name || f.username || f.email}</div>
                                {f.username && <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>@{f.username}</div>}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => router.push(`/social/chat?with=${f.userId}`)} style={{
                                    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.4)",
                                    background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: "700",
                                    fontSize: "0.78rem", cursor: "pointer" }}>💬 Chat</button>
                                <button onClick={() => removeFriend(f.userId)} style={{
                                    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)",
                                    background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: "700",
                                    fontSize: "0.78rem", cursor: "pointer" }}>Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Requests */}
            {tab === "requests" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {data.incoming.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: "0.75rem", fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Recibidas</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {data.incoming.map(r => (
                                    <div key={r.id} style={card}>
                                        {avatar(r.name || r.username || r.email)}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: "700", color: "white" }}>{r.name || r.username || r.email}</div>
                                            {r.username && <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>@{r.username}</div>}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => respond(r.id, "accept")} style={{
                                                padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.4)",
                                                background: "rgba(16,185,129,0.15)", color: "#34d399", fontWeight: "700",
                                                fontSize: "0.78rem", cursor: "pointer" }}>✓ Aceptar</button>
                                            <button onClick={() => respond(r.id, "reject")} style={{
                                                padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                                                background: "transparent", color: "rgba(255,255,255,0.4)", fontWeight: "700",
                                                fontSize: "0.78rem", cursor: "pointer" }}>Rechazar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.outgoing.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: "0.75rem", fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Enviadas (pendientes)</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {data.outgoing.map(r => (
                                    <div key={r.id} style={card}>
                                        {avatar(r.name || r.username || r.email)}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: "700", color: "white" }}>{r.name || r.username || r.email}</div>
                                            {r.username && <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>@{r.username}</div>}
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "700" }}>⏳ Pendiente</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.incoming.length === 0 && data.outgoing.length === 0 && (
                        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No hay solicitudes pendientes</div>
                    )}
                </div>
            )}

            {/* Search */}
            {tab === "search" && (
                <div>
                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nombre de usuario o nombre..."
                            style={{
                                width: "100%", padding: "12px 16px 12px 44px",
                                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
                            }}
                        />
                        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                    </div>

                    {searching && <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>Buscando...</div>}

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {searchResults.map(u => {
                            const alreadyFriend = data.friends.some(f => f.userId === u.id);
                            const pending = data.outgoing.some(o => o.receiverId === u.id);
                            return (
                                <div key={u.id} style={card}>
                                    {avatar(u.name || u.username || u.email)}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: "700", color: "white" }}>{u.name || u.username || u.email}</div>
                                        {u.username && <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>@{u.username}</div>}
                                    </div>
                                    {alreadyFriend ? (
                                        <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: "700" }}>✓ Amigo</span>
                                    ) : pending ? (
                                        <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "700" }}>⏳ Pendiente</span>
                                    ) : (
                                        <button onClick={() => sendRequest(u.id)} style={{
                                            padding: "7px 14px", borderRadius: "8px",
                                            border: "1px solid rgba(99,102,241,0.4)",
                                            background: "rgba(99,102,241,0.15)", color: "#818cf8",
                                            fontWeight: "700", fontSize: "0.78rem", cursor: "pointer" }}>
                                            + Añadir
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {!searching && search.length >= 2 && searchResults.length === 0 && (
                            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                                No se encontraron usuarios con ese nombre
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
