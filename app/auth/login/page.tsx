"use client";

import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDIGO = "#6366f1";
const INDIGO_DARK = "#4f46e5";
const INDIGO_GLOW = "rgba(99,102,241,0.35)";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await signIn("credentials", { email, password, redirect: false });
            if (res?.error) {
                setError("Correo o contraseña incorrectos");
                return;
            }
            // Comprobar si el usuario necesita elegir un nombre de usuario
            const session = await getSession();
            const hasUsername = !!(session?.user as any)?.username;
            router.push(hasUsername ? "/profiles" : "/auth/username");
        } catch {
            setError("Ha ocurrido un error. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        // Redirigir a /auth/username: si ya tiene usuario la página redirige sola a /profiles
        await signIn("google", { callbackUrl: "/auth/username" });
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

    return (
        <div style={{
            backgroundColor: "rgba(10,10,20,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "40px 44px 36px",
            borderRadius: "20px",
            color: "white",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: `0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.06)`,
        }}>

            {/* Logo VEXORA */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    letterSpacing: "4px",
                    background: `linear-gradient(135deg, #a5b4fc 0%, ${INDIGO} 50%, #7c3aed 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: "4px",
                    lineHeight: 1,
                }}>
                    VEXORA
                </div>
                <div style={{
                    width: "40px",
                    height: "2px",
                    background: `linear-gradient(90deg, transparent, ${INDIGO}, transparent)`,
                    margin: "10px auto 0",
                    borderRadius: "2px",
                }} />
            </div>

            <h2 style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "24px",
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                letterSpacing: "0.3px",
            }}>
                Bienvenido de vuelta
            </h2>

            {/* Botón Google */}
            <button
                onClick={handleGoogle}
                disabled={googleLoading}
                style={{
                    width: "100%",
                    padding: "13px",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: googleLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    marginBottom: "20px",
                    opacity: googleLoading ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                    if (!googleLoading) {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.11)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                    }
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
                }}
            >
                {googleLoading ? (
                    <span style={{ opacity: 0.7 }}>Redirigiendo...</span>
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                            <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                            <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                            <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                        </svg>
                        Continuar con Google
                    </>
                )}
            </button>

            {/* Separador */}
            <div style={{ position: "relative", textAlign: "center", margin: "0 0 20px" }}>
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
                <span style={{ position: "relative", background: "rgba(10,10,20,0.85)", padding: "0 14px", fontSize: "12px", color: "#4b5563" }}>
                    o inicia sesión con email
                </span>
            </div>

            {/* Formulario email/pass */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.08)",
                        color: "#fca5a5",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        border: "1px solid rgba(239,68,68,0.2)",
                    }}>
                        {error}
                    </div>
                )}

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
                        onFocus={e => {
                            e.currentTarget.style.borderColor = INDIGO;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`;
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                        required
                    />
                </div>

                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                            Contraseña
                        </label>
                        <Link href="/auth/forgot-password" style={{ fontSize: "12px", color: INDIGO, fontWeight: 600, opacity: 0.9 }}>
                            ¿La olvidaste?
                        </Link>
                    </div>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ ...inputBase, paddingRight: "46px" }}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = INDIGO;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${INDIGO_GLOW}`;
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: "15px", padding: "0" }}
                        >
                            {showPassword ? "🙈" : "👁"}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "14px",
                        background: loading
                            ? INDIGO_DARK
                            : `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
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
                        boxShadow: loading ? "none" : `0 4px 20px rgba(99,102,241,0.4)`,
                        textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                    onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#4b5563" }}>
                ¿No tienes cuenta?{" "}
                <Link href="/auth/register" style={{ color: "#a5b4fc", fontWeight: 700 }}>
                    Créala gratis
                </Link>
            </p>

        </div>
    );
}
