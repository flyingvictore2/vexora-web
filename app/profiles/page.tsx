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

function InputStyle(focused: boolean, error?: boolean): React.CSSProperties {
    return {
        width: "100%", padding: "13px 16px",
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${error ? "rgba(239,68,68,0.5)" : focused ? INDIGO : "rgba(255,255,255,0.1)"}`,
        boxShadow: focused ? `0 0 0 3px ${INDIGO_GLOW}` : "none",
        borderRadius: "10px", color: "white", fontSize: "15px",
        outline: "none", fontFamily: "inherit", transition: "all 0.2s",
    };
}

function Toggle({ on, onToggle, color = INDIGO }: { on: boolean; onToggle: () => void; color?: string }) {
    return (
        <button type="button" onClick={onToggle} style={{
            width: "44px", height: "24px", borderRadius: "12px", border: "none",
            cursor: "pointer", background: on ? color : "rgba(255,255,255,0.15)",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}>
            <span style={{
                position: "absolute", top: "2px", width: "20px", height: "20px",
                borderRadius: "50%", background: "white", transition: "left 0.2s",
                left: on ? "22px" : "2px",
            }} />
        </button>
    );
}

export default function ProfilesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [managing, setManaging] = useState(false);

    // Create / Edit modal shared state
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [editProfile, setEditProfile] = useState<any>(null);
    const [formName, setFormName] = useState("");
    const [formPin, setFormPin] = useState("");
    const [enablePin, setEnablePin] = useState(false);
    const [formIsKid, setFormIsKid] = useState(false);
    const [formColor, setFormColor] = useState(AVATAR_COLORS[0]);
    const [formEmoji, setFormEmoji] = useState(AVATAR_EMOJIS[0]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [focusField, setFocusField] = useState<string | null>(null);

    // PIN entry modal
    const [pinProfile, setPinProfile] = useState<any>(null);
    const [enteredPin, setEnteredPin] = useState("");
    const [pinError, setPinError] = useState("");
    const pinInputRef = useRef<HTMLInputElement>(null);

    // Delete confirm
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.email) fetchProfiles();
    }, [session]);

    useEffect(() => {
        if (pinProfile) setTimeout(() => pinInputRef.current?.focus(), 100);
    }, [pinProfile]);

    const fetchProfiles = async () => {
        try {
            const res = await fetch("/api/profiles");
            setProfiles(Array.isArray(await res.json()) ? await fetch("/api/profiles").then(r => r.json()) : []);
        } catch {}
        finally { setLoading(false); }
    };

    const refetch = async () => {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        setProfiles(Array.isArray(data) ? data : []);
    };

    const openCreate = () => {
        setModalMode("create"); setEditProfile(null);
        setFormName(""); setFormPin(""); setEnablePin(false);
        setFormIsKid(false); setFormColor(AVATAR_COLORS[0]); setFormEmoji(AVATAR_EMOJIS[0]);
        setFormError("");
    };

    const openEdit = (p: any) => {
        setModalMode("edit"); setEditProfile(p);
        setFormName(p.name); setFormPin(p.pin || "");
        setEnablePin(!!p.pin); setFormIsKid(p.isKid || false);
        setFormColor(p.avatarColor || AVATAR_COLORS[0]); setFormEmoji(p.avatarEmoji || AVATAR_EMOJIS[0]);
        setFormError("");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;
        if (enablePin && formPin.length !== 4) { setFormError("El PIN debe tener 4 dígitos"); return; }
        setSaving(true); setFormError("");
        try {
            const body = { name: formName.trim(), pin: enablePin ? formPin : null, isKid: formIsKid, avatarColor: formColor, avatarEmoji: formEmoji };
            const url = modalMode === "edit" ? `/api/profiles/${editProfile.id}` : "/api/profiles";
            const method = modalMode === "edit" ? "PATCH" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) { const d = await res.json().catch(() => ({})); setFormError(d.error || "Error al guardar"); return; }
            setModalMode(null);
            await refetch();
        } catch { setFormError("Error de red"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await fetch(`/api/profiles/${id}`, { method: "DELETE" });
            await refetch();
        } finally { setDeletingId(null); }
    };

    const handleSelectProfile = (profile: any) => {
        if (managing) return;
        if (profile.pin) { setPinProfile(profile); setEnteredPin(""); setPinError(""); }
        else { localStorage.setItem("selectedProfileId", profile.id); router.push("/"); }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (enteredPin === pinProfile.pin) { localStorage.setItem("selectedProfileId", pinProfile.id); router.push("/"); }
        else { setPinError("PIN incorrecto"); setEnteredPin(""); }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#08090d", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            Cargando...
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), #08090d`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "40px 20px", color: "white",
        }}>
            {/* Logo */}
            <div style={{ marginBottom: "48px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "4px", background: `linear-gradient(135deg, #a5b4fc 0%, ${INDIGO} 50%, #7c3aed 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, marginBottom: "8px" }}>VEXORA</div>
                <div style={{ width: "36px", height: "2px", background: `linear-gradient(90deg, transparent, ${INDIGO}, transparent)`, margin: "0 auto", borderRadius: "2px" }} />
            </div>

            <h1 style={{ fontSize: managing ? "1.6rem" : "2rem", fontWeight: 700, marginBottom: "12px", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.5px", transition: "all 0.2s" }}>
                {managing ? "Gestionar perfiles" : "¿Quién está viendo?"}
            </h1>
            {managing && <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "36px" }}>Edita o elimina tus perfiles</p>}
            {!managing && <div style={{ marginBottom: "40px" }} />}

            {/* Profiles grid */}
            <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", justifyContent: "center", marginBottom: "52px" }}>
                {profiles.map(profile => (
                    <div key={profile.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", position: "relative" }}>
                        <div onClick={() => handleSelectProfile(profile)} style={{
                            width: "140px", height: "140px", borderRadius: "16px",
                            border: managing ? "2px solid rgba(99,102,241,0.3)" : "3px solid rgba(255,255,255,0.06)",
                            overflow: "visible", position: "relative", transition: "all 0.25s ease",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            background: profile.avatarColor || "#6366f1",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "3.5rem", cursor: managing ? "default" : "pointer",
                            flexShrink: 0,
                        }}
                            onMouseEnter={e => { if (!managing) { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.transform = "scale(1.07) translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px ${INDIGO}`; } }}
                            onMouseLeave={e => { if (!managing) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)"; } }}
                        >
                            {profile.avatarEmoji || "😎"}
                            {profile.pin && !managing && <div style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "14px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>🔒</div>}
                            {profile.isKid && !managing && <div style={{ position: "absolute", bottom: "8px", left: "8px", fontSize: "12px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>👶</div>}
                        </div>

                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3px" }}>{profile.name}</span>

                        {/* Manage actions */}
                        {managing && (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => openEdit(profile)} style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(profile.id)} disabled={deletingId === profile.id} style={{ padding: "7px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "12px", fontWeight: 700, cursor: deletingId === profile.id ? "not-allowed" : "pointer", opacity: deletingId === profile.id ? 0.5 : 1 }}>
                                    {deletingId === profile.id ? "..." : "🗑️ Borrar"}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add profile */}
                {!managing && (
                    <div onClick={openCreate} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                        <div style={{ width: "140px", height: "140px", borderRadius: "16px", border: "2px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: "rgba(255,255,255,0.25)", transition: "all 0.25s ease" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.color = INDIGO; e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.transform = "scale(1.07) translateY(-4px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
                        >+</div>
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Añadir perfil</span>
                    </div>
                )}
            </div>

            {/* Bottom buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                {managing ? (
                    <>
                        <button onClick={openCreate} style={{ padding: "10px 24px", background: `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`, border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: "12px", letterSpacing: "1px", cursor: "pointer", boxShadow: `0 4px 20px rgba(99,102,241,0.3)` }}>
                            + AÑADIR PERFIL
                        </button>
                        <button onClick={() => setManaging(false)} style={{ padding: "10px 24px", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", fontWeight: 700, fontSize: "12px", letterSpacing: "1px", background: "transparent", cursor: "pointer" }}>
                            LISTO
                        </button>
                    </>
                ) : (
                    <button onClick={() => setManaging(true)} style={{ padding: "10px 28px", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)", borderRadius: "8px", fontWeight: 700, fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", background: "transparent", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                    >Gestionar perfiles</button>
                )}
            </div>

            {/* ── CREATE / EDIT MODAL ── */}
            {modalMode && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", overflowY: "auto" }}>
                    <div style={{ background: "rgba(10,10,20,0.97)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", padding: "36px 40px", width: "100%", maxWidth: "440px", boxShadow: "0 32px 64px rgba(0,0,0,0.7)", margin: "auto" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "28px", color: "white" }}>
                            {modalMode === "edit" ? "Editar perfil" : "Nuevo perfil"}
                        </h2>

                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Avatar preview + emoji */}
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                <div style={{ width: "72px", height: "72px", borderRadius: "12px", background: formColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0, boxShadow: `0 0 0 3px ${formColor}44` }}>{formEmoji}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Emoji</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {AVATAR_EMOJIS.map(em => (
                                            <button key={em} type="button" onClick={() => setFormEmoji(em)} style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "1.1rem", background: formEmoji === em ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", border: formEmoji === em ? `1px solid ${INDIGO}` : "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>{em}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Color</p>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {AVATAR_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setFormColor(c)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: formColor === c ? "3px solid white" : "3px solid transparent", cursor: "pointer", transition: "transform 0.1s", transform: formColor === c ? "scale(1.2)" : "scale(1)" }} />
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Nombre</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Mi perfil" required autoFocus
                                    style={InputStyle(focusField === "name")}
                                    onFocus={() => setFocusField("name")} onBlur={() => setFocusField(null)} />
                            </div>

                            {/* PIN */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: enablePin ? "12px" : "0" }}>
                                    <div>
                                        <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>🔒 PIN de acceso</p>
                                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>PIN de 4 dígitos para entrar</p>
                                    </div>
                                    <Toggle on={enablePin} onToggle={() => { setEnablePin(!enablePin); setFormPin(""); }} />
                                </div>
                                {enablePin && (
                                    <input type="password" inputMode="numeric" maxLength={4} value={formPin} onChange={e => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="····" required={enablePin}
                                        style={{ ...InputStyle(focusField === "pin"), fontSize: "22px", letterSpacing: "10px", textAlign: "center" }}
                                        onFocus={() => setFocusField("pin")} onBlur={() => setFocusField(null)} />
                                )}
                            </div>

                            {/* Kids mode */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>👶 Modo infantil</p>
                                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Solo contenido apto para niños</p>
                                </div>
                                <Toggle on={formIsKid} onToggle={() => setFormIsKid(!formIsKid)} color="#10b981" />
                            </div>

                            {formError && <p style={{ fontSize: "13px", color: "#fca5a5", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>{formError}</p>}

                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                <button type="submit" disabled={saving} style={{ flex: 1, padding: "14px", background: `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`, border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, letterSpacing: "0.5px", fontFamily: "inherit", boxShadow: `0 4px 20px rgba(99,102,241,0.35)` }}>
                                    {saving ? "Guardando..." : modalMode === "edit" ? "Guardar cambios" : "Crear perfil"}
                                </button>
                                <button type="button" onClick={() => setModalMode(null)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
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
                    <div style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", padding: "36px 40px", width: "100%", maxWidth: "360px", boxShadow: "0 32px 64px rgba(0,0,0,0.7)", textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>{pinProfile.avatarEmoji || "😎"}</div>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "6px" }}>{pinProfile.name}</h2>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "28px" }}>Introduce el PIN para acceder</p>
                        <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <input ref={pinInputRef} type="password" inputMode="numeric" maxLength={4} value={enteredPin} onChange={e => { setEnteredPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }} placeholder="····"
                                style={{ ...InputStyle(focusField === "pin-entry", !!pinError), fontSize: "28px", letterSpacing: "14px", textAlign: "center" }}
                                onFocus={() => setFocusField("pin-entry")} onBlur={() => setFocusField(null)} />
                            {pinError && <p style={{ fontSize: "13px", color: "#fca5a5" }}>{pinError}</p>}
                            <button type="submit" disabled={enteredPin.length !== 4} style={{ padding: "14px", background: enteredPin.length === 4 ? `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)` : "rgba(255,255,255,0.06)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: 700, cursor: enteredPin.length === 4 ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s", boxShadow: enteredPin.length === 4 ? `0 4px 20px rgba(99,102,241,0.35)` : "none" }}>Entrar</button>
                            <button type="button" onClick={() => setPinProfile(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
