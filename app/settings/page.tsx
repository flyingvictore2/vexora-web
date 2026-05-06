"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const THEME_COLORS = [
    { id: "indigo", name: "Indigo",  color: "#6366f1" },
    { id: "red",    name: "Rojo",    color: "#e50914" },
    { id: "purple", name: "Morado",  color: "#8b5cf6" },
    { id: "blue",   name: "Azul",    color: "#2563eb" },
    { id: "green",  name: "Verde",   color: "#10b981" },
    { id: "pink",   name: "Rosa",    color: "#ec4899" },
    { id: "orange", name: "Naranja", color: "#f97316" },
];

const LANGUAGES = [
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "en", name: "English", flag: "🇬🇧" },
    { id: "pt", name: "Português", flag: "🇵🇹" },
    { id: "fr", name: "Français", flag: "🇫🇷" },
];

const DALTONISM = [
    { id: "none",   name: "Ninguno" },
    { id: "protan", name: "Protanopía (rojo-verde)" },
    { id: "deutan", name: "Deuteranopía (verde-rojo)" },
    { id: "tritan", name: "Tritanopía (azul-amarillo)" },
];

export default function SettingsPage() {
    const router = useRouter();
    const [profileId, setProfileId] = useState<string | null>(null);
    const [prefs, setPrefs] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        if (!pid) { router.push("/profiles"); return; }
        setProfileId(pid);
        fetch(`/api/preferences?profileId=${pid}`).then(r => r.json()).then(setPrefs);
    }, [router]);

    const update = (patch: any) => setPrefs((p: any) => ({ ...p, ...patch }));

    const save = async () => {
        if (!profileId) return;
        setSaving(true);
        await fetch("/api/preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, ...prefs }),
        });
        localStorage.setItem("prefs", JSON.stringify(prefs));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Re-apply preferences immediately
        window.location.reload();
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem", color: "white" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", marginBottom: "1.5rem", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                ← Volver
            </button>

            <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem" }}>Personalización</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2.5rem", fontSize: "0.95rem" }}>
                Ajusta el aspecto de Vexora a tu gusto.
            </p>

            {/* Theme color */}
            <Section title="Color principal">
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {THEME_COLORS.map(t => (
                        <button key={t.id} onClick={() => update({ themeColor: t.id })}
                            style={{
                                padding: "10px 16px", borderRadius: "10px", cursor: "pointer",
                                background: prefs.themeColor === t.id ? `${t.color}20` : "rgba(255,255,255,0.04)",
                                border: `2px solid ${prefs.themeColor === t.id ? t.color : "rgba(255,255,255,0.08)"}`,
                                color: "white", fontWeight: "700", fontSize: "0.85rem",
                                display: "flex", alignItems: "center", gap: "8px",
                            }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: t.color, display: "inline-block" }} />
                            {t.name}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Background */}
            <Section title="Fondo personalizado de la home">
                <input
                    type="url"
                    placeholder="https://… (URL de imagen)"
                    value={prefs.backgroundUrl || ""}
                    onChange={e => update({ backgroundUrl: e.target.value })}
                    style={inputStyle}
                />
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
                    Deja vacío para usar el fondo por defecto.
                </p>
            </Section>

            {/* Avatar GIF */}
            <Section title="Avatar animado (GIF)">
                <input
                    type="url"
                    placeholder="https://… (URL de GIF)"
                    value={prefs.avatarGifUrl || ""}
                    onChange={e => update({ avatarGifUrl: e.target.value })}
                    style={inputStyle}
                />
                {prefs.avatarGifUrl && (
                    <img src={prefs.avatarGifUrl} alt="preview" style={{ marginTop: "10px", width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover" }} />
                )}
            </Section>

            {/* Language */}
            <Section title="Idioma de la interfaz">
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {LANGUAGES.map(l => (
                        <button key={l.id} onClick={() => update({ language: l.id })}
                            style={{
                                padding: "12px 18px", borderRadius: "10px", cursor: "pointer",
                                background: prefs.language === l.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                                border: `2px solid ${prefs.language === l.id ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                color: "white", fontWeight: "700", fontSize: "0.9rem",
                            }}>
                            {l.flag} {l.name}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Accessibility */}
            <Section title="Accesibilidad">
                <div style={{ marginBottom: "1.25rem" }}>
                    <label style={labelStyle}>Modo daltonismo</label>
                    <select
                        value={prefs.daltonismMode || "none"}
                        onChange={e => update({ daltonismMode: e.target.value })}
                        style={{ ...inputStyle, cursor: "pointer" }}
                    >
                        {DALTONISM.map(d => <option key={d.id} value={d.id} style={{ color: "black" }}>{d.name}</option>)}
                    </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={!!prefs.reducedMotion}
                        onChange={e => update({ reducedMotion: e.target.checked })}
                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.92rem", fontWeight: "600" }}>Reducir animaciones</span>
                </label>
            </Section>

            <button
                onClick={save}
                disabled={saving}
                style={{
                    marginTop: "2rem",
                    padding: "14px 36px",
                    background: saved ? "#10b981" : "linear-gradient(135deg, var(--primary, #6366f1), #7c3aed)",
                    color: "white", border: "none", borderRadius: "10px",
                    fontWeight: "800", fontSize: "0.95rem", cursor: "pointer",
                    letterSpacing: "0.5px", textTransform: "uppercase",
                }}
            >
                {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }}>
            <h2 style={{ fontSize: "0.78rem", fontWeight: "800", letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: "1rem" }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "8px",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
};
