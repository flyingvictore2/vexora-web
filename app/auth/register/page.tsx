"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDIGO = "#6366f1";
const INDIGO_DARK = "#4f46e5";
const INDIGO_GLOW = "rgba(99,102,241,0.35)";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [allowRegister, setAllowRegister] = useState<boolean | null>(null);

    React.useEffect(() => {
        fetch("/api/config")
            .then(res => res.json())
            .then(data => { setAllowRegister(data.allowNewRegistrations ?? true); })
            .catch(() => { setAllowRegister(true); });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await axios.post("/api/auth/register", { email, password });
            router.push("/auth/login");
        } catch (err: any) {
            setError(err.response?.data || "Ocurrió un error al registrarte");
        } finally {
            setLoading(false);
        }
    };

    const inputBase: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        color: "white",
        fontSize: "15px",
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: "rgba(10,10,20,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "40px 44px 36px",
        borderRadius: "20px",
        color: "white",
        border: "1px solid rgba(99,102,241,0.2)",
        boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.06)",
    };

    // Mientras carga la config, mostrar el formulario directamente (evita el flash)
    if (allowRegister === false) {
        return (
            <div style={cardStyle}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{
                        fontSize: "2.2rem", fontWeight: 900, letterSpacing: "4px",
                        background: "linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #7c3aed 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                        VEXORA
                    </div>
                    <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, transparent, #6366f1, transparent)", margin: "10px auto 0", borderRadius: "2px" }} />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: "16px" }}>Registros desactivados</h2>
                <p style={{ color: "#6b7280", textAlign: "center", fontSize: "14px", marginBottom: "24px" }}>
                    Actualmente no estamos aceptando nuevos usuarios. Vuelve a intentarlo más tarde.
                </p>
                <Link href="/auth/login" style={{ display: "block", textAlign: "center", color: "#a5b4fc", fontWeight: 700, fontSize: "14px" }}>
                    ← Volver al inicio de sesión
                </Link>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            {/* Logo VEXORA */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    letterSpacing: "4px",
                    background: "linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1,
                }}>
                    VEXORA
                </div>
                <div style={{
                    width: "40px", height: "2px",
                    background: "linear-gradient(90deg, transparent, #6366f1, transparent)",
                    margin: "10px auto 0", borderRadius: "2px",
                }} />
            </div>

            <h2 style={{
                fontSize: "18px", fontWeight: 600, marginBottom: "28px",
                color: "rgba(255,255,255,0.85)", textAlign: "center", letterSpacing: "0.3px",
            }}>
                Crea tu cuenta
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.08)", color: "#fca5a5",
                        padding: "11px 14px", borderRadius: "8px", fontSize: "13px",
                        border: "1px solid rgba(239,68,68,0.2)",
                    }}>
                        {error}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        style={inputBase}
                        onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                        required
                    />
                </div>

                {/* Contraseña */}
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                        Contraseña
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            style={{ ...inputBase, paddingRight: "46px" }}
                            onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: "15px" }}
                        >
                            {showPassword ? "🙈" : "👁"}
                        </button>
                    </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                        Confirmar contraseña
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                            ...inputBase,
                            borderColor: confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`; }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                        required
                    />
                </div>

                {/* Botón */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: loading ? INDIGO_DARK : `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                        border: "none",
                        borderRadius: "10px",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        marginTop: "4px",
                        letterSpacing: "0.8px",
                        fontFamily: "inherit",
                        transition: "opacity 0.2s, transform 0.1s",
                        boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                        textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                    onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#4b5563" }}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" style={{ color: "#a5b4fc", fontWeight: 700 }}>
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
