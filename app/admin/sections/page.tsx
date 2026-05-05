"use client";

import React, { useEffect, useState } from "react";

const NAV_SECTIONS = [
    { key: "nav.movies",   label: "Películas",   icon: "🎬", desc: "Sección de películas (/movies)" },
    { key: "nav.series",   label: "Series",      icon: "📺", desc: "Sección de series (/series)" },
    { key: "nav.animes",   label: "Animes",      icon: "🎌", desc: "Sección de anime (/animes)" },
    { key: "nav.list",     label: "Listas",      icon: "📋", desc: "Listas personalizadas de usuarios (/list)" },
    { key: "nav.calendar", label: "Calendario",  icon: "📅", desc: "Calendario de estrenos (/calendar)" },
    { key: "nav.requests", label: "Solicitudes", icon: "✍️", desc: "Solicitudes de contenido (/requests)" },
    { key: "nav.support",  label: "Soporte",     icon: "💬", desc: "Sección de soporte (/support)" },
    { key: "nav.plans",    label: "Planes",      icon: "💎", desc: "Página de planes de pago (/plans)" },
    { key: "nav.search",   label: "Búsqueda",    icon: "🔍", desc: "Icono de búsqueda en la barra" },
];

export default function AdminSectionsPage() {
    const [sections, setSections] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/config")
            .then(r => r.json())
            .then(data => {
                const s: Record<string, boolean> = {};
                for (const item of NAV_SECTIONS) {
                    s[item.key] = data[item.key] !== false;
                }
                setSections(s);
            })
            .finally(() => setLoading(false));
    }, []);

    const toggle = async (key: string) => {
        const newVal = !sections[key];
        setSections(prev => ({ ...prev, [key]: newVal }));
        setSaving(key);
        setSaved(null);
        try {
            await fetch("/api/admin/sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, visible: newVal }),
            });
            setSaved(key);
            setTimeout(() => setSaved(null), 2000);
        } catch {
            // revert on error
            setSections(prev => ({ ...prev, [key]: !newVal }));
        } finally {
            setSaving(null);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "white", margin: 0 }}>
                    Visibilidad de Secciones
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "8px", fontSize: "0.9rem" }}>
                    Activa o desactiva secciones del menú de navegación para todos los usuarios.
                </p>
            </div>

            {loading ? (
                <div style={{ color: "rgba(255,255,255,0.4)", padding: "2rem 0" }}>Cargando configuración...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px" }}>
                    {NAV_SECTIONS.map(item => {
                        const isVisible = sections[item.key] !== false;
                        const isSaving = saving === item.key;
                        const isSaved = saved === item.key;
                        return (
                            <div
                                key={item.key}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "18px 22px", borderRadius: "14px",
                                    backgroundColor: "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isVisible ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)"}`,
                                    transition: "all 0.2s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <span style={{ fontSize: "1.5rem", filter: isVisible ? "none" : "grayscale(100%) opacity(0.4)" }}>
                                        {item.icon}
                                    </span>
                                    <div>
                                        <div style={{ color: isVisible ? "white" : "rgba(255,255,255,0.4)", fontWeight: "700", fontSize: "0.95rem" }}>
                                            {item.label}
                                        </div>
                                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", marginTop: "2px" }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {isSaved && (
                                        <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: "700" }}>✓ Guardado</span>
                                    )}
                                    {/* Toggle switch */}
                                    <button
                                        onClick={() => toggle(item.key)}
                                        disabled={isSaving}
                                        style={{
                                            width: "52px", height: "28px", borderRadius: "14px", border: "none",
                                            backgroundColor: isVisible ? "#2563eb" : "rgba(255,255,255,0.1)",
                                            cursor: isSaving ? "not-allowed" : "pointer",
                                            position: "relative", transition: "background-color 0.2s",
                                            opacity: isSaving ? 0.6 : 1,
                                            flexShrink: 0,
                                        }}
                                        title={isVisible ? "Ocultar sección" : "Mostrar sección"}
                                    >
                                        <span style={{
                                            position: "absolute", top: "4px",
                                            left: isVisible ? "28px" : "4px",
                                            width: "20px", height: "20px", borderRadius: "50%",
                                            backgroundColor: "white",
                                            transition: "left 0.2s",
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                                        }} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{
                marginTop: "2rem", padding: "16px 20px", borderRadius: "10px",
                backgroundColor: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)",
                fontSize: "0.82rem", color: "rgba(251,191,36,0.8)", maxWidth: "600px",
            }}>
                ⚠️ Los cambios son inmediatos pero el navegador del usuario puede tardar unos segundos en reflejarlos por caché.
                El menú INICIO siempre es visible.
            </div>
        </div>
    );
}
