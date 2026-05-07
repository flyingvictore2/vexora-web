"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDIGO = "#6366f1";
const INDIGO_GLOW = "rgba(99,102,241,0.35)";

function inputStyle(focused: boolean, state?: "ok" | "error"): React.CSSProperties {
    return {
        width: "100%", padding: "13px 16px",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: `1px solid ${state === "ok" ? "rgba(16,185,129,0.5)" : state === "error" ? "rgba(239,68,68,0.5)" : focused ? INDIGO : "rgba(255,255,255,0.1)"}`,
        boxShadow: focused ? `0 0 0 3px ${INDIGO_GLOW}` : "none",
        borderRadius: "10px", color: "white", fontSize: "15px",
        outline: "none", fontFamily: "inherit", transition: "all 0.2s",
    };
}

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [allowRegister, setAllowRegister] = useState<boolean | null>(null);
    const [focused, setFocused] = useState<string | null>(null);

    // Username availability
    const [usernameState, setUsernameState] = useState<"idle" | "checking" | "ok" | "error">("idle");
    const [usernameMsg, setUsernameMsg] = useState("");
    const checkTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch("/api/config").then(r => r.json()).then(d => setAllowRegister(d.allowNewRegistrations ?? true)).catch(() => setAllowRegister(true));
    }, []);

    // Debounced username check
    useEffect(() => {
        if (!username) { setUsernameState("idle"); setUsernameMsg(""); return; }
        setUsernameState("checking");
        if (checkTimer.current) clearTimeout(checkTimer.current);
        checkTimer.current = setTimeout(async () => {
            try {
                const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
                const d = await r.json();
                if (d.available) { setUsernameState("ok"); setUsernameMsg("¡Disponible!"); }
                else { setUsernameState("error"); setUsernameMsg(d.error || "No disponible"); }
            } catch { setUsernameState("error"); setUsernameMsg("Error al comprobar"); }
        }, 450);
        return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameState !== "ok") { setError("Elige un nombre de usuario disponible"); return; }
        if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
        setLoading(true); setError("");
        try {
            await axios.post("/api/auth/register", { email, password, username: username.toLowerCase().trim() });
            router.push("/auth/login?registered=1");
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data || "Ocurrió un error al registrarte");
        } finally { setLoading(false); }
    };

    if (allowRegister === false) return (
        <div style={cardStyle}>
            <Logo />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: "16px" }}>Registros desactivados</h2>
            <p style={{ color: "#6b7280", textAlign: "center", fontSize: "14px", marginBottom: "24px" }}>No estamos aceptando nuevos usuarios. Vuelve más tarde.</p>
            <Link href="/auth/login" style={{ display: "block", textAlign: "center", color: "#a5b4fc", fontWeight: 700, fontSize: "14px" }}>← Volver al inicio de sesión</Link>
        </div>
    );

    return (
        <div style={cardStyle}>
            <Logo />
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "24px", color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
                Crea tu cuenta
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {error}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
                        style={inputStyle(focused === "email")}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                </div>

                {/* Username */}
                <div>
                    <label style={labelStyle}>Nombre de usuario</label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "15px", pointerEvents: "none" }}>@</span>
                        <input
                            type="text" value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))}
                            placeholder="mi_usuario"
                            required
                            style={{ ...inputStyle(focused === "user", usernameState === "ok" ? "ok" : usernameState === "error" ? "error" : undefined), paddingLeft: "30px", paddingRight: "32px" }}
                            onFocus={() => setFocused("user")} onBlur={() => setFocused(null)}
                        />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
                            {usernameState === "checking" && <span style={{ color: "#94a3b8", fontSize: "11px" }}>...</span>}
                            {usernameState === "ok" && "✅"}
                            {usernameState === "error" && "❌"}
                        </span>
                    </div>
                    {usernameMsg && (
                        <p style={{ fontSize: "12px", marginTop: "5px", color: usernameState === "ok" ? "#34d399" : "#fca5a5" }}>
                            {usernameMsg}
                        </p>
                    )}
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                        3–20 caracteres · letras, números, punto y guión bajo
                    </p>
                </div>

                {/* Contraseña */}
                <div>
                    <label style={labelStyle}>Contraseña</label>
                    <div style={{ position: "relative" }}>
                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required
                            style={{ ...inputStyle(focused === "pwd"), paddingRight: "46px" }}
                            onFocus={() => setFocused("pwd")} onBlur={() => setFocused(null)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: "15px" }}>
                            {showPassword ? "🙈" : "👁"}
                        </button>
                    </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                    <label style={labelStyle}>Confirmar contraseña</label>
                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required
                        style={inputStyle(focused === "cpwd", confirmPassword && confirmPassword !== password ? "error" : undefined)}
                        onFocus={() => setFocused("cpwd")} onBlur={() => setFocused(null)} />
                </div>

                <button type="submit" disabled={loading || usernameState !== "ok"} style={{
                    width: "100%", padding: "14px",
                    background: loading || usernameState !== "ok" ? "rgba(99,102,241,0.4)" : `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                    border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: 700,
                    cursor: loading || usernameState !== "ok" ? "not-allowed" : "pointer",
                    marginTop: "4px", letterSpacing: "0.8px", fontFamily: "inherit",
                    transition: "all 0.2s", textTransform: "uppercase",
                    boxShadow: loading || usernameState !== "ok" ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                }}>
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#4b5563" }}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" style={{ color: "#a5b4fc", fontWeight: 700 }}>Inicia sesión</Link>
            </p>
        </div>
    );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Logo() {
    return (
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "4px", background: "linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                VEXORA
            </div>
            <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, transparent, #6366f1, transparent)", margin: "10px auto 0", borderRadius: "2px" }} />
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    padding: "40px 44px 36px", borderRadius: "20px", color: "white",
    border: "1px solid rgba(99,102,241,0.2)",
    boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6)",
};

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280",
    marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase",
};
