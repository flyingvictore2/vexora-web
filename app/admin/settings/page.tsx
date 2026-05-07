"use client";

import React, { useEffect, useState } from "react";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        siteName: "Series.ly",
        contactEmail: "soporte@series.ly",
        allowNewRegistrations: true,
        maintenanceTarget: "false",
        maintenanceTime: "30 MINUTOS",
        maintenanceTitle: "Próximamente",
        maintenanceMessage: "Estamos trabajando en algo increíble. Vuelve pronto.",
        maintenanceEmoji: "🚀",
        stripeEnabled: true,
        paypalEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (!res.ok) throw new Error("Error fetching");
                const data = await res.json();
                setSettings({
                    siteName: data.siteName || "Series.ly",
                    contactEmail: data.contactEmail || "soporte@series.ly",
                    allowNewRegistrations: data.allowNewRegistrations === "true",
                    maintenanceTarget: data.maintenanceTarget || "false",
                    maintenanceTime: data.maintenanceTime || "30 MINUTOS",
                    maintenanceTitle: data.maintenanceTitle || "Próximamente",
                    maintenanceMessage: data.maintenanceMessage || "Estamos trabajando en algo increíble. Vuelve pronto.",
                    maintenanceEmoji: data.maintenanceEmoji || "🚀",
                    stripeEnabled: data.stripeEnabled !== "false",
                    paypalEnabled: data.paypalEnabled !== "false",
                });
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = (key: string) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Failed");
            showToast("✅ Configuración guardada correctamente en la base de datos.");
        } catch {
            showToast("Error al guardar la configuración.", false);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Sincronizando configuración...</div>;

    return (
        <div style={{ maxWidth: "1000px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
                    padding: "16px 24px", borderRadius: "12px", fontWeight: "700",
                    backgroundColor: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: toast.ok ? "var(--success)" : "var(--error)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                    {toast.msg}
                </div>
            )}

            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Ajustes Globales</h1>
                <p style={{ color: "var(--text-secondary)" }}>Configura el comportamiento fundamental de tu plataforma.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                {/* General Settings */}
                <section className="glass-card" style={{ padding: "2.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>🌐</span> Información General
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={labelStyle}>Nombre del Sitio</label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Email de Contacto</label>
                            <input
                                type="email"
                                value={settings.contactEmail}
                                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </section>

                {/* Platform Control */}
                <section className="glass-card" style={{ padding: "2.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>⚡</span> Control de Plataforma
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                        <div style={toggleRowStyle}>
                            <div>
                                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "white" }}>Nuevos Registros</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Permitir que nuevos usuarios se unan.</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("allowNewRegistrations")}
                                style={settings.allowNewRegistrations ? toggleOnStyle : toggleOffStyle}
                            >
                                {settings.allowNewRegistrations ? "ACTIVO" : "INACTIVO"}
                            </button>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--error)", marginBottom: "6px" }}>Modo Mantenimiento</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "14px" }}>Muestra una pantalla de mantenimiento a los visitantes.</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {([
                                    { value: "false",      label: "🟢 Desactivado",  desc: "Nadie ve mantenimiento" },
                                    { value: "NON_ADMINS", label: "🟡 Solo usuarios", desc: "Admins ven el sitio normal" },
                                    { value: "ALL",        label: "🔴 Todos",         desc: "Incluido admins" },
                                ] as { value: string; label: string; desc: string }[]).map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, maintenanceTarget: opt.value }))}
                                        title={opt.desc}
                                        style={{
                                            flex: 1,
                                            padding: "8px 6px",
                                            borderRadius: "8px",
                                            fontWeight: "800",
                                            fontSize: "0.72rem",
                                            cursor: "pointer",
                                            border: settings.maintenanceTarget === opt.value
                                                ? "1px solid rgba(99,102,241,0.6)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                            background: settings.maintenanceTarget === opt.value
                                                ? "rgba(99,102,241,0.2)"
                                                : "rgba(255,255,255,0.04)",
                                            color: settings.maintenanceTarget === opt.value ? "white" : "rgba(255,255,255,0.45)",
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {settings.maintenanceTarget !== "false" && (
                            <div style={{ padding: "16px", backgroundColor: "rgba(239,68,68,0.05)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.1)", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: "10px" }}>
                                    <div>
                                        <label style={labelStyle}>Título</label>
                                        <input
                                            type="text"
                                            value={settings.maintenanceTitle}
                                            onChange={e => setSettings({ ...settings, maintenanceTitle: e.target.value })}
                                            placeholder="Próximamente"
                                            style={{ ...inputStyle, backgroundColor: "rgba(0,0,0,0.2)" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Emoji</label>
                                        <input
                                            type="text"
                                            value={settings.maintenanceEmoji}
                                            onChange={e => setSettings({ ...settings, maintenanceEmoji: e.target.value })}
                                            placeholder="🚀"
                                            style={{ ...inputStyle, backgroundColor: "rgba(0,0,0,0.2)", textAlign: "center", fontSize: "1.4rem", padding: "8px" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Mensaje</label>
                                    <input
                                        type="text"
                                        value={settings.maintenanceMessage}
                                        onChange={e => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                                        placeholder="Estamos trabajando en algo increíble..."
                                        style={{ ...inputStyle, backgroundColor: "rgba(0,0,0,0.2)" }}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Tiempo Estimado</label>
                                    <input
                                        type="text"
                                        value={settings.maintenanceTime}
                                        onChange={e => setSettings({ ...settings, maintenanceTime: e.target.value })}
                                        placeholder="Ej: 30 MINUTOS o 1 HORA"
                                        style={{ ...inputStyle, backgroundColor: "rgba(0,0,0,0.2)" }}
                                    />
                                </div>
                                <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>
                                    {settings.maintenanceTarget === "ALL"
                                        ? "⚠️ Todos (incluidos admins) verán esta pantalla. Accede al panel por /admin para desactivarlo."
                                        : "ℹ️ Solo los usuarios sin rol admin verán esta pantalla."}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Integrations */}
                <section className="glass-card" style={{ padding: "2.5rem", gridColumn: "span 2" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>🔌</span> Pasarelas de Pago e Integraciones
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                <div style={{ width: "40px", height: "40px", backgroundColor: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "var(--primary)", fontWeight: "900" }}>S</span>
                                </div>
                                <span style={{ fontWeight: "700" }}>Stripe Checkout</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("stripeEnabled")}
                                style={settings.stripeEnabled ? toggleOnStyle : toggleOffStyle}
                            >
                                {settings.stripeEnabled ? "ON" : "OFF"}
                            </button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                <div style={{ width: "40px", height: "40px", backgroundColor: "#0070ba", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "white", fontWeight: "900" }}>P</span>
                                </div>
                                <span style={{ fontWeight: "700" }}>PayPal Standard</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("paypalEnabled")}
                                style={settings.paypalEnabled ? toggleOnStyle : toggleOffStyle}
                            >
                                {settings.paypalEnabled ? "ON" : "OFF"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div style={{ marginTop: "3rem", textAlign: "right" }}>
                <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                    style={{ minWidth: "220px", opacity: saving ? 0.7 : 1 }}
                    disabled={saving}
                >
                    {saving ? "Guardando..." : "GUARDAR CONFIGURACIÓN"}
                </button>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none"
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: "800",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px"
};

const toggleRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};

const toggleOnStyle: React.CSSProperties = {
    padding: "6px 16px",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "var(--success)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: "800"
};

const toggleOffStyle: React.CSSProperties = {
    padding: "6px 16px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "var(--error)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: "800"
};
