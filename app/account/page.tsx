"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InvoiceDownloader from "@/components/InvoiceDownloader";
import { useT } from "@/components/LangProvider";
import type { Lang } from "@/lib/i18n";

type Tab = "perfil" | "personalizacion" | "seguridad" | "suscripcion" | "facturacion";

const PRIMARY = "var(--primary)";

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: "1.25rem" }}>
            {children}
        </h2>
    );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div className="glass-card" style={{ padding: "2rem", ...style }}>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    transition: "border-color 0.2s",
};

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
    return (
        <div style={{
            padding: "12px 14px", borderRadius: "8px", fontSize: "13px",
            background: type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: type === "success" ? "#34d399" : "#f87171",
            border: `1px solid ${type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
            {msg}
        </div>
    );
}

// ── Personalización constants ─────────────────────────────────────────────────

const THEME_COLORS = [
    { id: "indigo", name: "Índigo",  color: "#6366f1" },
    { id: "red",    name: "Rojo",    color: "#e50914" },
    { id: "purple", name: "Morado",  color: "#8b5cf6" },
    { id: "blue",   name: "Azul",    color: "#2563eb" },
    { id: "green",  name: "Verde",   color: "#10b981" },
    { id: "pink",   name: "Rosa",    color: "#ec4899" },
    { id: "orange", name: "Naranja", color: "#f97316" },
];

const DALTONISM = [
    { id: "none",   name: "Sin filtro" },
    { id: "protan", name: "Protanopía (rojo-verde)" },
    { id: "deutan", name: "Deuteranopía (verde-rojo)" },
    { id: "tritan", name: "Tritanopía (azul-amarillo)" },
];

const THEMES: Record<string, { primary: string; primaryDark: string; glow: string }> = {
    indigo: { primary: "#6366f1", primaryDark: "#4f46e5", glow: "rgba(99,102,241,0.35)" },
    red:    { primary: "#e50914", primaryDark: "#b00610", glow: "rgba(229,9,20,0.35)" },
    purple: { primary: "#8b5cf6", primaryDark: "#7c3aed", glow: "rgba(139,92,246,0.35)" },
    blue:   { primary: "#2563eb", primaryDark: "#1d4ed8", glow: "rgba(37,99,235,0.35)" },
    green:  { primary: "#10b981", primaryDark: "#059669", glow: "rgba(16,185,129,0.35)" },
    pink:   { primary: "#ec4899", primaryDark: "#db2777", glow: "rgba(236,72,153,0.35)" },
    orange: { primary: "#f97316", primaryDark: "#ea580c", glow: "rgba(249,115,22,0.35)" },
};

// Apply CSS variables immediately (no reload needed)
function applyTheme(prefs: any) {
    const root = document.documentElement;
    const theme = THEMES[prefs?.themeColor || "indigo"] || THEMES.indigo;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-dark", theme.primaryDark);
    root.style.setProperty("--primary-glow", theme.glow);

    if (prefs?.backgroundUrl) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.85)),url("${prefs.backgroundUrl}")`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    } else {
        document.body.style.backgroundImage = "";
    }

    if (prefs?.reducedMotion) root.classList.add("reduced-motion");
    else root.classList.remove("reduced-motion");

    const daltonFilters: Record<string, string> = {
        none: "none", protan: "url(#protanopia)", deutan: "url(#deuteranopia)", tritan: "url(#tritanopia)",
    };
    root.style.filter = daltonFilters[prefs?.daltonismMode || "none"] ?? "none";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { setLang } = useT();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as Tab) || "perfil";
    const [tab, setTab] = useState<Tab>(initialTab);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Perfil
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Contraseña
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwdLoading, setPwdLoading] = useState(false);

    // Personalización
    const [profileId, setProfileId] = useState<string | null>(null);
    const [prefs, setPrefs] = useState<any>({
        themeColor: "indigo", backgroundUrl: "", avatarGifUrl: "",
        daltonismMode: "none", reducedMotion: false,
    });
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);
    const [prefsMsg, setPrefsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/login");
    }, [status, router]);

    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/account/profile")
            .then(r => r.json())
            .then(d => { setUserData(d); setName(d.name || ""); setEmail(d.email || ""); })
            .finally(() => setLoading(false));

        // Load preferences
        const pid = localStorage.getItem("selectedProfileId");
        if (pid) {
            setProfileId(pid);
            fetch(`/api/preferences?profileId=${pid}`)
                .then(r => r.json())
                .then(data => {
                    if (data && !data.error) setPrefs((p: any) => ({ ...p, ...data }));
                })
                .catch(() => {});
        }
    }, [status]);

    if (status === "loading" || loading) {
        return (
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
            </div>
        );
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    const saveProfile = async () => {
        setProfileLoading(true); setProfileMsg(null);
        try {
            const res = await fetch("/api/account/profile", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar");
            setProfileMsg({ type: "success", text: "¡Perfil actualizado!" });
            setUserData((prev: any) => ({ ...prev, name: data.name, email: data.email }));
        } catch (e: any) {
            setProfileMsg({ type: "error", text: e.message });
        } finally { setProfileLoading(false); }
    };

    const changePassword = async () => {
        if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "Las contraseñas nuevas no coinciden" }); return; }
        if (newPwd.length < 6)    { setPwdMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" }); return; }
        setPwdLoading(true); setPwdMsg(null);
        try {
            const res = await fetch("/api/account/password", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña");
            setPwdMsg({ type: "success", text: "¡Contraseña actualizada!" });
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (e: any) {
            setPwdMsg({ type: "error", text: e.message });
        } finally { setPwdLoading(false); }
    };

    const updatePrefs = (patch: any) => {
        const next = { ...prefs, ...patch };
        setPrefs(next);
        // Live preview — theme
        applyTheme(next);
        // Live preview — language
        if (patch.language) setLang(patch.language as Lang);
    };

    const savePrefs = async () => {
        if (!profileId) { setPrefsMsg({ type: "error", text: "No hay perfil seleccionado. Ve a perfiles primero." }); return; }
        setPrefsSaving(true); setPrefsMsg(null);
        try {
            const res = await fetch("/api/preferences", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId, ...prefs }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Error al guardar");
            localStorage.setItem("prefs", JSON.stringify(prefs));
            setPrefsSaved(true);
            setPrefsMsg({ type: "success", text: "¡Preferencias guardadas! Los cambios están activos." });
            setTimeout(() => { setPrefsSaved(false); setPrefsMsg(null); }, 3000);
        } catch (e: any) {
            setPrefsMsg({ type: "error", text: e.message });
        } finally { setPrefsSaving(false); }
    };

    // ── Data helpers ──────────────────────────────────────────────────────────

    const currentPlan = userData?.subscription?.plan || "GRATIS";
    const nextBilling = userData?.subscription?.nextBillingDate
        ? new Date(userData.subscription.nextBillingDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
        : null;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "perfil",          label: "Perfil",           icon: "👤" },
        { id: "personalizacion", label: "Personalización",  icon: "🎨" },
        { id: "seguridad",       label: "Seguridad",        icon: "🔒" },
        { id: "suscripcion",     label: "Suscripción",      icon: "⭐" },
        { id: "facturacion",     label: "Facturación",      icon: "🧾" },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px 60px" }}>

            {/* Header */}
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "6px" }}>Configuración de cuenta</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Gestiona tu perfil, apariencia, seguridad y suscripción.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "2rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "4px", flexWrap: "wrap" }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: "8px 16px", borderRadius: "7px", border: "none", fontFamily: "inherit",
                        fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: "6px",
                        background: tab === t.id ? "var(--primary)" : "transparent",
                        color: tab === t.id ? "white" : "var(--text-secondary)",
                    }}>
                        <span style={{ fontSize: "14px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ─── PERFIL ───────────────────────────────────────────────────── */}
            {tab === "perfil" && (
                <Card>
                    <SectionTitle>Información personal</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
                        {profileMsg && <Alert type={profileMsg.type} msg={profileMsg.text} />}
                        <Field label="Nombre">
                            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
                        </Field>
                        <Field label="Email">
                            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
                        </Field>
                        <Field label="Rol">
                            <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "var(--text-secondary)" }}>
                                {(session?.user as any)?.role === "ADMIN" ? "🛡️ Administrador" : "👤 Usuario"}
                            </div>
                        </Field>
                        <Field label="Miembro desde">
                            <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "var(--text-secondary)" }}>
                                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                            </div>
                        </Field>
                        <button className="btn btn-primary" onClick={saveProfile} disabled={profileLoading}
                            style={{ alignSelf: "flex-start", opacity: profileLoading ? 0.7 : 1 }}>
                            {profileLoading ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                    <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Perfiles</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>Gestiona los perfiles de tu cuenta.</p>
                        <Link href="/profiles" className="btn btn-secondary" style={{ fontSize: "13px", padding: "8px 18px" }}>
                            Gestionar perfiles
                        </Link>
                    </div>
                </Card>
            )}

            {/* ─── PERSONALIZACIÓN ──────────────────────────────────────────── */}
            {tab === "personalizacion" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                    {!profileId && (
                        <div style={{ padding: "14px 18px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", fontSize: "13px", color: "#fbbf24" }}>
                            ⚠️ No tienes perfil seleccionado. <Link href="/profiles" style={{ color: "#fbbf24", textDecoration: "underline" }}>Selecciona uno</Link> para guardar cambios.
                        </div>
                    )}

                    {/* Color de tema */}
                    <Card>
                        <SectionTitle>Color principal</SectionTitle>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {THEME_COLORS.map(t => (
                                <button key={t.id} onClick={() => updatePrefs({ themeColor: t.id })} style={{
                                    padding: "10px 16px", borderRadius: "10px", cursor: "pointer",
                                    background: prefs.themeColor === t.id ? `${t.color}22` : "rgba(255,255,255,0.04)",
                                    border: `2px solid ${prefs.themeColor === t.id ? t.color : "rgba(255,255,255,0.08)"}`,
                                    color: "white", fontWeight: 700, fontSize: "13px",
                                    display: "flex", alignItems: "center", gap: "8px",
                                    transition: "all 0.15s",
                                }}>
                                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.color, display: "inline-block", flexShrink: 0, boxShadow: prefs.themeColor === t.id ? `0 0 8px ${t.color}` : "none" }} />
                                    {t.name}
                                    {prefs.themeColor === t.id && <span style={{ fontSize: "11px", opacity: 0.7 }}>✓</span>}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "12px" }}>
                            El color se aplica en tiempo real. Haz clic en "Guardar" para que persista.
                        </p>
                    </Card>

                    {/* Fondo personalizado */}
                    <Card>
                        <SectionTitle>Fondo personalizado</SectionTitle>
                        <input
                            type="url" placeholder="https://... (URL de imagen)"
                            value={prefs.backgroundUrl || ""}
                            onChange={e => updatePrefs({ backgroundUrl: e.target.value })}
                            style={inputStyle}
                            onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>
                            Se aplica como fondo oscuro en toda la app. Deja vacío para el fondo por defecto.
                        </p>
                        {prefs.backgroundUrl && (
                            <div style={{ marginTop: "12px", position: "relative", height: "80px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <img src={prefs.backgroundUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} onError={e => (e.currentTarget.style.display = "none")} />
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "white", fontWeight: 700 }}>
                                    Vista previa
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Avatar GIF */}
                    <Card>
                        <SectionTitle>Avatar animado (GIF)</SectionTitle>
                        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <input
                                    type="url" placeholder="https://... (URL de GIF)"
                                    value={prefs.avatarGifUrl || ""}
                                    onChange={e => updatePrefs({ avatarGifUrl: e.target.value })}
                                    style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                                />
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>
                                    Se mostrará en tu perfil en lugar del avatar estático.
                                </p>
                            </div>
                            {prefs.avatarGifUrl ? (
                                <img src={prefs.avatarGifUrl} alt="preview" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)", flexShrink: 0 }} onError={e => (e.currentTarget.style.display = "none")} />
                            ) : (
                                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                                    👤
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Idioma */}
                    <Card>
                        <SectionTitle>Idioma de la interfaz</SectionTitle>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {([
                                { id: "es", name: "Español",    flag: "🇪🇸" },
                                { id: "en", name: "English",    flag: "🇬🇧" },
                                { id: "pt", name: "Português",  flag: "🇵🇹" },
                                { id: "fr", name: "Français",   flag: "🇫🇷" },
                            ] as { id: Lang; name: string; flag: string }[]).map(l => (
                                <button key={l.id} onClick={() => updatePrefs({ language: l.id })} style={{
                                    padding: "12px 18px", borderRadius: "10px", cursor: "pointer",
                                    background: prefs.language === l.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                                    border: `2px solid ${prefs.language === l.id ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                    color: prefs.language === l.id ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                                    fontWeight: 700, fontSize: "14px", transition: "all 0.15s",
                                    display: "flex", alignItems: "center", gap: "8px",
                                }}>
                                    <span style={{ fontSize: "20px" }}>{l.flag}</span>
                                    {l.name}
                                    {prefs.language === l.id && <span style={{ fontSize: "11px", opacity: 0.7 }}>✓</span>}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "10px" }}>
                            Cambia el idioma de los menús y textos de la interfaz al instante.
                        </p>
                    </Card>

                    {/* Accesibilidad */}
                    <Card>
                        <SectionTitle>Accesibilidad</SectionTitle>

                        {/* Daltonismo */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                Modo daltonismo
                            </label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {DALTONISM.map(d => (
                                    <button key={d.id} onClick={() => updatePrefs({ daltonismMode: d.id })} style={{
                                        padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                                        background: prefs.daltonismMode === d.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${prefs.daltonismMode === d.id ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                        color: prefs.daltonismMode === d.id ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                                        transition: "all 0.15s",
                                    }}>
                                        {d.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reducir animaciones */}
                        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}>
                            <div
                                onClick={() => updatePrefs({ reducedMotion: !prefs.reducedMotion })}
                                style={{
                                    width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s", position: "relative", flexShrink: 0,
                                    background: prefs.reducedMotion ? "var(--primary)" : "rgba(255,255,255,0.15)",
                                }}
                            >
                                <div style={{
                                    position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s",
                                    left: prefs.reducedMotion ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                                }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 700 }}>Reducir animaciones</div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Desactiva transiciones y efectos visuales</div>
                            </div>
                        </label>
                    </Card>

                    {/* Botón guardar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <button onClick={savePrefs} disabled={prefsSaving} style={{
                            padding: "12px 32px",
                            background: prefsSaved ? "#10b981" : "var(--primary)",
                            color: "white", border: "none", borderRadius: "10px",
                            fontWeight: 800, fontSize: "14px", cursor: prefsSaving ? "not-allowed" : "pointer",
                            letterSpacing: "0.5px", textTransform: "uppercase", opacity: prefsSaving ? 0.7 : 1,
                            transition: "all 0.2s",
                        }}>
                            {prefsSaving ? "Guardando..." : prefsSaved ? "✓ Guardado" : "Guardar preferencias"}
                        </button>
                        {prefsMsg && <Alert type={prefsMsg.type} msg={prefsMsg.text} />}
                    </div>
                </div>
            )}

            {/* ─── SEGURIDAD ────────────────────────────────────────────────── */}
            {tab === "seguridad" && (
                <Card>
                    <SectionTitle>Cambiar contraseña</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
                        {pwdMsg && <Alert type={pwdMsg.type} msg={pwdMsg.text} />}
                        {userData?.password !== undefined && (
                            <Field label="Contraseña actual">
                                <div style={{ position: "relative" }}>
                                    <input type={showPwd ? "text" : "password"} style={{ ...inputStyle, paddingRight: "42px" }}
                                        value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••"
                                        onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "15px" }}>
                                        {showPwd ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </Field>
                        )}
                        <Field label="Nueva contraseña">
                            <input type={showPwd ? "text" : "password"} style={inputStyle} value={newPwd}
                                onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres"
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
                        </Field>
                        <Field label="Confirmar nueva contraseña">
                            <input type={showPwd ? "text" : "password"} style={{ ...inputStyle, borderColor: confirmPwd && confirmPwd !== newPwd ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
                                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••"
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                                onBlur={e => (e.currentTarget.style.borderColor = confirmPwd && confirmPwd !== newPwd ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)")} />
                        </Field>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={changePassword} disabled={pwdLoading} style={{ opacity: pwdLoading ? 0.7 : 1 }}>
                                {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
                            </button>
                            <Link href="/auth/forgot-password" style={{ fontSize: "13px", color: "var(--primary)" }}>
                                ¿Olvidaste la actual?
                            </Link>
                        </div>
                    </div>
                    <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Sesión</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>Cierra sesión en todos los dispositivos.</p>
                        <button onClick={() => { localStorage.removeItem("selectedProfileId"); signOut({ callbackUrl: "/auth/login" }); }}
                            className="btn btn-secondary" style={{ fontSize: "13px", padding: "8px 18px" }}>
                            Cerrar sesión
                        </button>
                    </div>
                </Card>
            )}

            {/* ─── SUSCRIPCIÓN ──────────────────────────────────────────────── */}
            {tab === "suscripcion" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <Card>
                        <SectionTitle>Plan actual</SectionTitle>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>{currentPlan}</span>
                            <span style={{
                                padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                                background: userData?.subscription ? "rgba(16,185,129,0.15)" : "rgba(71,85,105,0.3)",
                                color: userData?.subscription ? "#34d399" : "#94a3b8",
                                border: `1px solid ${userData?.subscription ? "rgba(16,185,129,0.25)" : "rgba(71,85,105,0.3)"}`,
                            }}>
                                {userData?.subscription ? "Activo" : "Gratis"}
                            </span>
                        </div>
                        {nextBilling && <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Próximo cobro: <strong style={{ color: "white" }}>{nextBilling}</strong></p>}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <Link href="/plans" className="btn btn-primary" style={{ fontSize: "13px" }}>
                                {userData?.subscription ? "Cambiar plan" : "Mejorar a Premium"}
                            </Link>
                            {userData?.subscription && (
                                <button className="btn btn-secondary" style={{ fontSize: "13px", color: "#f87171" }}
                                    onClick={async () => { if (!confirm("¿Seguro que quieres cancelar?")) return; await fetch("/api/subscribe", { method: "DELETE" }); window.location.reload(); }}>
                                    Cancelar suscripción
                                </button>
                            )}
                        </div>
                    </Card>
                    <Card>
                        <SectionTitle>Qué incluye cada plan</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                            {[
                                { name: "GRATIS", color: "#475569", features: ["Catálogo básico", "720p", "1 perfil"] },
                                { name: "BRONCE", color: "#cd7f32", features: ["Catálogo completo", "1080p", "2 perfiles", "Sin anuncios"] },
                                { name: "PLATA",  color: "#94a3b8", features: ["Todo de Bronce", "4K", "3 perfiles", "Descargas"] },
                                { name: "ORO",    color: "#fbbf24", features: ["Todo de Plata", "4K HDR", "5 perfiles", "Acceso anticipado"] },
                            ].map(p => (
                                <div key={p.name} style={{ padding: "1rem", borderRadius: "10px", border: `1px solid ${currentPlan === p.name ? p.color : "rgba(255,255,255,0.06)"}`, background: currentPlan === p.name ? `${p.color}15` : "rgba(255,255,255,0.02)" }}>
                                    <div style={{ fontWeight: 800, color: p.color, marginBottom: "0.75rem", fontSize: "14px" }}>{p.name} {currentPlan === p.name && "✓"}</div>
                                    {p.features.map(f => <div key={f} style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>· {f}</div>)}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ─── FACTURACIÓN ──────────────────────────────────────────────── */}
            {tab === "facturacion" && (
                <Card style={{ overflowX: "auto" }}>
                    <SectionTitle>Historial de pagos</SectionTitle>
                    {userData?.invoices?.length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    {["Fecha", "Plan", "Estado", "Total", "Factura"].map(h => (
                                        <th key={h} style={{ padding: "10px 12px", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700, textAlign: h === "Factura" ? "right" : "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {userData.invoices.map((inv: any) => (
                                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        <td style={{ padding: "14px 12px", fontSize: "13px" }}>{new Date(inv.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                        <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: "13px" }}>{inv.plan}</td>
                                        <td style={{ padding: "14px 12px" }}>
                                            <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: inv.status === "PAID" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: inv.status === "PAID" ? "#34d399" : "#f87171" }}>
                                                {inv.status === "PAID" ? "Pagado" : inv.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: "13px" }}>{new Intl.NumberFormat("es-ES", { style: "currency", currency: inv.currency || "EUR" }).format(inv.amount)}</td>
                                        <td style={{ padding: "14px 12px", textAlign: "right" }}>
                                            <InvoiceDownloader invoice={{ id: inv.id, date: new Date(inv.date).toLocaleDateString("es-ES"), amount: new Intl.NumberFormat("es-ES", { style: "currency", currency: inv.currency || "EUR" }).format(inv.amount), plan: inv.plan, status: inv.status }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧾</div>
                            <p style={{ marginBottom: "1rem" }}>No tienes facturas todavía.</p>
                            <Link href="/plans" className="btn btn-primary" style={{ fontSize: "13px" }}>Ver planes</Link>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
