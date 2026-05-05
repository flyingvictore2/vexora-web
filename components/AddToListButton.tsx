"use client";

import React, { useState, useEffect, useRef } from "react";

interface UserList {
    id: string;
    name: string;
    items: { movieId: string }[];
}

interface AddToListButtonProps {
    movieId: string;
    minimal?: boolean;
}

export default function AddToListButton({ movieId, minimal }: AddToListButtonProps) {
    const [open, setOpen] = useState(false);
    const [lists, setLists] = useState<UserList[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newListName, setNewListName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const isInAnyList = lists.some(l => l.items.some(i => i.movieId === movieId));

    useEffect(() => {
        const id = localStorage.getItem("selectedProfileId");
        setProfileId(id);
        setIsGuest(document.cookie.split(";").some(c => c.trim() === "vexora_guest=1"));
    }, []);

    useEffect(() => {
        if (!open || !profileId) return;
        setLoading(true);
        setError(null);
        fetch(`/api/lists?profileId=${profileId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.error) {
                    setError(data.error);
                } else {
                    setLists(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => setError("No se pudieron cargar las listas"))
            .finally(() => setLoading(false));
    }, [open, profileId]);

    // Cerrar al pulsar fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleInList = async (list: UserList) => {
        const inList = list.items.some(i => i.movieId === movieId);
        setSavingId(list.id);
        try {
            const res = await fetch(`/api/lists/${list.id}`, {
                method: inList ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId }),
            });
            if (!res.ok) return; // silently ignore duplicates
            setLists(prev => prev.map(l => l.id === list.id
                ? {
                    ...l,
                    items: inList
                        ? l.items.filter(i => i.movieId !== movieId)
                        : [...l.items, { movieId }],
                }
                : l
            ));
        } finally {
            setSavingId(null);
        }
    };

    const createList = async () => {
        if (!newListName.trim()) return;
        if (!profileId) {
            setCreateError("Selecciona un perfil primero");
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const res = await fetch("/api/lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId, name: newListName.trim() }),
            });
            const newList = await res.json();
            if (!res.ok || newList.error) {
                setCreateError(newList.error || "Error al crear la lista");
                return;
            }

            // Añadir película directamente a la nueva lista
            await fetch(`/api/lists/${newList.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId }),
            });

            setLists(prev => [...prev, { ...newList, items: [{ movieId }] }]);
            setNewListName("");
        } catch {
            setCreateError("Error de red. Inténtalo de nuevo.");
        } finally {
            setCreating(false);
        }
    };

    const btnStyle: React.CSSProperties = minimal ? {
        width: "36px", height: "36px", borderRadius: "50%",
        border: isInAnyList ? "2px solid #2563eb" : "2px solid rgba(255,255,255,0.3)",
        backgroundColor: isInAnyList ? "rgba(37,99,235,0.2)" : "rgba(0,0,0,0.4)",
        color: "white", fontSize: "1.1rem", display: "flex",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
    } : {
        padding: "0.8rem 2rem", borderRadius: "8px", fontWeight: "700",
        border: isInAnyList ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.2)",
        backgroundColor: isInAnyList ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.05)",
        color: "white", fontSize: "0.95rem", cursor: "pointer",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
    };

    // Guest mode: show a "sign in" prompt instead
    if (isGuest) {
        return (
            <a href="/auth/login" style={{
                ...(minimal ? {
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                } : {
                    padding: "0.8rem 2rem", borderRadius: "8px", fontWeight: "700",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", gap: "8px",
                }),
                color: "rgba(255,255,255,0.4)", textDecoration: "none",
                fontSize: minimal ? "1rem" : "0.95rem",
            }}
            title="Inicia sesión para añadir a listas"
            >
                {minimal ? "🔒" : "🔒 Inicia sesión para añadir"}
            </a>
        );
    }

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button
                style={btnStyle}
                onClick={() => setOpen(v => !v)}
                title={isInAnyList ? "En mis listas" : "Añadir a lista"}
                onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
            >
                {minimal
                    ? (isInAnyList ? "✓" : "+")
                    : (<>{isInAnyList ? "✓" : "+"} {isInAnyList ? "En mis listas" : "Añadir a lista"}</>)
                }
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)",
                    left: minimal ? "auto" : 0, right: minimal ? 0 : "auto",
                    zIndex: 999, minWidth: "250px",
                    backgroundColor: "rgba(15,18,30,0.98)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px", padding: "12px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(16px)",
                }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                        Mis listas
                    </p>

                    {!profileId ? (
                        <div style={{ padding: "12px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                            Selecciona un perfil para gestionar listas
                        </div>
                    ) : loading ? (
                        <div style={{ padding: "12px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Cargando...</div>
                    ) : error ? (
                        <div style={{ padding: "12px 0", textAlign: "center", color: "#f87171", fontSize: "0.8rem" }}>{error}</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
                            {lists.length === 0 && (
                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", padding: "8px 0", textAlign: "center" }}>
                                    Aún no tienes listas
                                </div>
                            )}
                            {lists.map(list => {
                                const inList = list.items.some(i => i.movieId === movieId);
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => toggleInList(list)}
                                        disabled={savingId === list.id}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "9px 12px", borderRadius: "8px",
                                            backgroundColor: inList ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${inList ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)"}`,
                                            cursor: "pointer", transition: "all 0.15s",
                                            color: inList ? "white" : "rgba(255,255,255,0.7)",
                                            fontWeight: inList ? "700" : "500", fontSize: "0.85rem",
                                            opacity: savingId === list.id ? 0.5 : 1,
                                        }}
                                    >
                                        <span>📋 {list.name}</span>
                                        <span style={{
                                            width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                            border: `2px solid ${inList ? "#2563eb" : "rgba(255,255,255,0.2)"}`,
                                            backgroundColor: inList ? "#2563eb" : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "10px", color: "white",
                                        }}>
                                            {inList ? "✓" : ""}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Crear nueva lista */}
                    {profileId && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "10px" }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>
                                Nueva lista
                            </p>
                            {createError && (
                                <p style={{ fontSize: "0.72rem", color: "#f87171", marginBottom: "6px" }}>{createError}</p>
                            )}
                            <div style={{ display: "flex", gap: "6px" }}>
                                <input
                                    value={newListName}
                                    onChange={e => { setNewListName(e.target.value); setCreateError(null); }}
                                    onKeyDown={e => e.key === "Enter" && createList()}
                                    placeholder="Nombre de la lista..."
                                    style={{
                                        flex: 1, padding: "8px 10px", borderRadius: "7px", fontSize: "0.82rem",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                        border: createError ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                        color: "white", outline: "none",
                                    }}
                                />
                                <button
                                    onClick={createList}
                                    disabled={!newListName.trim() || creating}
                                    style={{
                                        padding: "8px 12px", borderRadius: "7px", fontWeight: "700",
                                        backgroundColor: newListName.trim() ? "#2563eb" : "rgba(255,255,255,0.05)",
                                        border: "none", color: "white", cursor: newListName.trim() ? "pointer" : "not-allowed",
                                        fontSize: "0.82rem", transition: "all 0.2s",
                                        opacity: creating ? 0.6 : 1,
                                    }}
                                >
                                    {creating ? "..." : "Crear"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
