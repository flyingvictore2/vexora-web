"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const INDIGO = "#6366f1";
const INDIGO_GLOW = "rgba(99,102,241,0.4)";

const AVATAR_COLORS = [
    "#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b",
    "#ef4444","#10b981","#3b82f6","#f97316","#84cc16",
];

const AVATAR_EMOJIS = ["😎","🦁","🐱","🐼","🦊","🐸","🎭","🚀","🎮","🌟","🎨","🎵"];

export default function ProfilesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create modal
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPin, setNewPin] = useState("");
    const [enablePin, setEnablePin] = useState(false);
    const [isKid, setIsKid] = useState(false);
    const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
    const [selectedEmoji, setSelectedEmoji] = useState(AVATAR_EMOJIS[0]);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // PIN entry modal
    const [pinProfile, setPinProfile] = useState<any>(null);
    const [enteredPin, setEnteredPin] = useState("");
    const [pinError, setPinError] = useState("");
    const pinInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (session?.user?.email) fetchProfiles();
    }, [session]);

    useEffect(() => {
        if (pinProfile) setTimeout(() => pinInputRef.current?.focus(), 100);
    }, [pinProfile]);

    const fetchProfiles = async () => {
        try {
            const res = await fetch("/api/profiles");
            const data = await res.json();
            setProfiles(Array.isArray(data) ? data : []);
        } catch {}
        finally { setLoading(false); }
    };

    const handleSelectProfile = (profile: any) => {
        if (profile.pin) {
            setPinProfile(profile);
            setEnteredPin("");
            setPinError("");
        } else {
            localStorage.setItem("selectedProfileId", profile.id);
            router.push("/");
        }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (enteredPin === pinProfile.pin) {
            localStorage.setItem("selectedProfileId", pinProfile.id);
            router.push("/");
        } else {
            setPinError("PIN incorrecto");
            setEnteredPin("");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        if (enablePin && newPin.length !== 4) { setCreateError("El PIN debe tener 4 dígitos"); return; }
        setCreating(true);
        setCreateError("");
        try {
            const res = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName.trim(),
                    pin: enablePin ? newPin : null,
                    isKid,
                    avatarColor: selectedColor,
                    avatarEmoji: selectedEmoji,
                }),
            });
            if (!res.ok) { setCreateError("Error al crear el perfil"); return; }
            setIsCreating(false);
            resetCreate();
            fetchProfiles();
        } catch { setCreateError("Error de red"); }
        finally { setCreating(false); }
    };

    const resetCreate = () => {
        setNewName(""); setNewPin(""); setEnablePin(false);
        setIsKid(false); setSelectedColor(AVATAR_COLORS[0]);
        setSelectedEmoji(AVATAR_EMOJIS[0]); setCreateError("");
    };

    const getAvatarBg = (profile: any) =>
        profile.avatarColor || "#6366f1";

    const getAvatarEmoji = (profile: any) =>
        profile.avatarEmoji || "😎";

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#08090d", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            Cargando...
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: `
                radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%),
                #08090d
            `,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            color: "white",
        }}>
            {/* Logo */}
            <div style={{ marginBottom: "48px", textAlign: "center" }}>
                <div style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    letterSpacing: "4px",
                    background: `linear-gradient(135deg, #a5b4fc 0%, ${INDIGO} 50%, #7c3aed 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1,
                    marginBottom: "8px",
                }}>VEXORA</div>
                <div style={{ width: "36px", height: "2px", background: `linear-gradient(90deg, transparent, ${INDIGO}, transparent)`, margin: "0 auto", borderRadius: "2px" }} />
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "48px", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.5px" }}>
                ¿Quién está viendo?
            </h1>

            {/* Profiles grid */}
            <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", justifyContent: "center", marginBottom: "52px" }}>
                {profiles.map(profile => (
                    <div key={profile.id} onClick={() => handleSelectProfile(profile)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                        <div style={{
                            width: "140px", height: "140px", borderRadius: "16px",
                            border: "3px solid rgba(255,255,255,0.06)",
                            overflow: "hidden", position: "relative",
                            transition: "all 0.25s ease",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            background: profile.image && !profile.avatarEmoji
                                ? `url(${profile.image}) center/cover`
                                : getAvatarBg(profile),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "3.5rem",
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = INDIGO;
                                e.currentTarget.style.transform = "scale(1.07) translateY(-4px)";
                                e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px ${INDIGO}`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.transform = "scale(1) translateY(0)";
                                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
                            }}
                        >
                            {(!profile.image || profile.avatarEmoji) && getAvatarEmoji(profile)}
                            {profile.pin && (
                                <div style={{
                                    position: "absolute", bottom: "8px", right: "8px",
                                    fontSize: "14px", background: "rgba(0,0,0,0.6)",
                                    borderRadius: "50%", width: "24px", height: "24px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>🔒</div>
                            )}
                            {profile.isKid && (
                                <div style={{
                                    position: "absolute", bottom: "8px", left: "8px",
                                    fontSize: "12px", background: "rgba(0,0,0,0.6)",
                                    borderRadius: "50%", width: "24px", height: "24px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>👶</div>
                            )}
                        </div>
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3px" }}>
                            {profile.name}
                        </span>
                    </div>
                ))}

                {/* Add profile */}
                <div onClick={() => { resetCreate(); setIsCreating(true); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                    <div style={{
                        width: "140px", height: "140px", borderRadius: "16px",
                        border: "2px dashed rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2.5rem", color: "rgba(255,255,255,0.25)",
                        transition: "all 0.25s ease",
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = INDIGO;
                            e.currentTarget.style.color = INDIGO;
                            e.currentTarget.style.background = "rgba(99,102,241,0.06)";
                            e.currentTarget.style.transform = "scale(1.07) translateY(-4px)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "scale(1) translateY(0)";
                        }}
                    >+</div>
                    <span style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Añadir perfil</span>
                </div>
            </div>

            <button onClick={() => router.push("/account")}
                style={{
                    padding: "10px 28px", border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.45)", borderRadius: "8px", fontWeight: 700,
                    fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase",
                    transition: "all 0.2s", background: "transparent", cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
                Gestionar perfiles
            </button>

            {/* ── CREATE MODAL ── */}
            {isCreating && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{
                        background: "rgba(10,10,20,0.95)", border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: "20px", padding: "36px 40px", width: "100%", maxWidth: "440px",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.7)",
                    }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "28px", color: "white" }}>Nuevo perfil</h2>

                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Avatar preview */}
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "4px" }}>
                                <div style={{
                                    width: "72px", height: "72px", borderRadius: "12px",
                                    background: selectedColor, display: "flex", alignItems: "center",
                                    justifyContent: "center", fontSize: "2rem", flexShrink: 0,
                                    boxShadow: `0 0 0 3px ${selectedColor}44`,
                                }}>{selectedEmoji}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Emoji</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {AVATAR_EMOJIS.map(em => (
                                            <button key={em} type="button" onClick={() => setSelectedEmoji(em)}
                                                style={{
                                                    width: "32px", height: "32px", borderRadius: "8px", fontSize: "1.1rem",
                                                    background: selectedEmoji === em ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                                                    border: selectedEmoji === em ? `1px solid ${INDIGO}` : "1px solid rgba(255,255,255,0.08)",
                                                    cursor: "pointer",
                                                }}>{em}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Color</p>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {AVATAR_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setSelectedColor(c)}
                                            style={{
                                                width: "28px", height: "28px", borderRadius: "50%", background: c,
                                                border: selectedColor === c ? "3px solid white" : "3px solid transparent",
                                                cursor: "pointer", transition: "transform 0.1s",
                                                transform: selectedColor === c ? "scale(1.2)" : "scale(1)",
                                            }} />
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Nombre</label>
                                <input
                                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                                    placeholder="Mi perfil" autoFocus required
                                    style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "15px", outline: "none", fontFamily: "inherit" }}
                                    onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                                />
                            </div>

                            {/* PIN toggle */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: enablePin ? "12px" : "0" }}>
                                    <div>
                                        <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>🔒 PIN de acceso</p>
                                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Protege este perfil con un PIN de 4 dígitos</p>
                                    </div>
                                    <button type="button" onClick={() => { setEnablePin(!enablePin); setNewPin(""); }}
                                        style={{
                                            width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                                            background: enablePin ? INDIGO : "rgba(255,255,255,0.15)",
                                            position: "relative", transition: "background 0.2s", flexShrink: 0,
                                        }}>
                                        <span style={{
                                            position: "absolute", top: "2px", width: "20px", height: "20px",
                                            borderRadius: "50%", background: "white", transition: "left 0.2s",
                                            left: enablePin ? "22px" : "2px",
                                        }} />
                                    </button>
                                </div>
                                {enablePin && (
                                    <input
                                        type="password" inputMode="numeric" maxLength={4}
                                        value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                        placeholder="····" required={enablePin}
                                        style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "22px", letterSpacing: "10px", outline: "none", fontFamily: "inherit", textAlign: "center" }}
                                        onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                )}
                            </div>

                            {/* Kids mode */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>👶 Modo infantil</p>
                                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Solo muestra contenido apto para niños</p>
                                </div>
                                <button type="button" onClick={() => setIsKid(!isKid)}
                                    style={{
                                        width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                                        background: isKid ? "#10b981" : "rgba(255,255,255,0.15)",
                                        position: "relative", transition: "background 0.2s", flexShrink: 0,
                                    }}>
                                    <span style={{
                                        position: "absolute", top: "2px", width: "20px", height: "20px",
                                        borderRadius: "50%", background: "white", transition: "left 0.2s",
                                        left: isKid ? "22px" : "2px",
                                    }} />
                                </button>
                            </div>

                            {createError && (
                                <p style={{ fontSize: "13px", color: "#fca5a5", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
                                    {createError}
                                </p>
                            )}

                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                <button type="submit" disabled={creating}
                                    style={{
                                        flex: 1, padding: "14px",
                                        background: `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                                        border: "none", borderRadius: "10px", color: "white",
                                        fontSize: "14px", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
                                        opacity: creating ? 0.7 : 1, letterSpacing: "0.5px", fontFamily: "inherit",
                                        boxShadow: `0 4px 20px rgba(99,102,241,0.35)`,
                                    }}>
                                    {creating ? "Guardando..." : "Crear perfil"}
                                </button>
                                <button type="button" onClick={() => setIsCreating(false)}
                                    style={{
                                        flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px",
                                        color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 700,
                                        cursor: "pointer", fontFamily: "inherit",
                                    }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PIN ENTRY MODAL ── */}
            {pinProfile && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{
                        background: "rgba(10,10,20,0.95)", border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: "20px", padding: "36px 40px", width: "100%", maxWidth: "360px",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.7)", textAlign: "center",
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
                            {pinProfile.avatarEmoji || "😎"}
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "6px" }}>
                            {pinProfile.name}
                        </h2>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "28px" }}>
                            Introduce el PIN para acceder
                        </p>

                        <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <input
                                ref={pinInputRef}
                                type="password" inputMode="numeric" maxLength={4}
                                value={enteredPin} onChange={e => { setEnteredPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
                                placeholder="····"
                                style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${pinError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: "white", fontSize: "28px", letterSpacing: "14px", outline: "none", fontFamily: "inherit", textAlign: "center" }}
                                onFocus={e => { if (!pinError) { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; } }}
                                onBlur={e => { if (!pinError) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; } }}
                            />
                            {pinError && <p style={{ fontSize: "13px", color: "#fca5a5" }}>{pinError}</p>}

                            <button type="submit" disabled={enteredPin.length !== 4}
                                style={{
                                    padding: "14px", background: enteredPin.length === 4 ? `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)` : "rgba(255,255,255,0.06)",
                                    border: "none", borderRadius: "10px", color: "white",
                                    fontSize: "14px", fontWeight: 700, cursor: enteredPin.length === 4 ? "pointer" : "not-allowed",
                                    fontFamily: "inherit", transition: "all 0.2s",
                                    boxShadow: enteredPin.length === 4 ? `0 4px 20px rgba(99,102,241,0.35)` : "none",
                                }}>
                                Entrar
                            </button>
                            <button type="button" onClick={() => setPinProfile(null)}
                                style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
