"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [allowRegister, setAllowRegister] = useState(true);

    React.useEffect(() => {
        fetch("/api/config")
            .then(res => res.json())
            .then(data => { setAllowRegister(data.allowNewRegistrations); })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            if (res?.error) {
                setError("Correo o contraseña incorrectos");
                return;
            }
            router.push("/profiles");
        } catch {
            setError("Ha ocurrido un error. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "16px 14px",
        backgroundColor: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "6px",
        color: "white",
        fontSize: "15px",
        outline: "none",
        transition: "border-color 0.2s",
        fontFamily: "inherit",
    };

    return (
        <div style={{
            backgroundColor: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(12px)",
            padding: "48px 48px 40px",
            borderRadius: "8px",
            color: "white",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}>

            {/* Título */}
            <h1 style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "28px",
                color: "white",
            }}>
                Iniciar sesión
            </h1>

            {/* Botones sociales */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/profiles" })}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "background 0.2s",
                        fontFamily: "inherit",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                        <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                    </svg>
                    Continuar con Google
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                        onClick={() => signIn("discord", { callbackUrl: "/profiles" })}
                        style={{
                            padding: "11px",
                            backgroundColor: "rgba(88,101,242,0.2)",
                            border: "1px solid rgba(88,101,242,0.35)",
                            borderRadius: "6px",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            fontFamily: "inherit",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(88,101,242,0.35)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(88,101,242,0.2)")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.053a19.905 19.905 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                        </svg>
                        Discord
                    </button>
                    <button
                        onClick={() => signIn("twitch", { callbackUrl: "/profiles" })}
                        style={{
                            padding: "11px",
                            backgroundColor: "rgba(145,70,255,0.2)",
                            border: "1px solid rgba(145,70,255,0.35)",
                            borderRadius: "6px",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            fontFamily: "inherit",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(145,70,255,0.35)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(145,70,255,0.2)")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#9146FF">
                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                        </svg>
                        Twitch
                    </button>
                </div>
            </div>

            {/* Separador */}
            <div style={{ position: "relative", textAlign: "center", margin: "20px 0" }}>
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
                <span style={{ position: "relative", backgroundColor: "transparent", padding: "0 12px", fontSize: "12px", color: "#6b7280" }}>
                    O con tu email
                </span>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)",
                        color: "#f87171",
                        padding: "12px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        border: "1px solid rgba(239,68,68,0.25)",
                    }}>
                        {error}
                    </div>
                )}

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", letterSpacing: "0.5px" }}>
                        EMAIL
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = "rgba(229,9,20,0.6)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                        required
                    />
                </div>

                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.5px" }}>CONTRASEÑA</label>
                        <Link href="/auth/forgot-password" style={{ fontSize: "12px", color: "#e50914", fontWeight: 600 }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ ...inputStyle, paddingRight: "44px" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(229,9,20,0.6)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                                opacity: 0.5, cursor: "pointer", fontSize: "16px", color: "white", background: "none", border: "none"
                            }}
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
                        padding: "15px",
                        backgroundColor: loading ? "#b81d24" : "#e50914",
                        border: "none",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        marginTop: "6px",
                        transition: "background 0.2s, transform 0.1s",
                        letterSpacing: "0.5px",
                        fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#c5000d"; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = "#e50914"; }}
                >
                    {loading ? "Iniciando..." : "INICIAR SESIÓN"}
                </button>
            </form>

            {allowRegister && (
                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#9ca3af" }}>
                    ¿No tienes una cuenta?{" "}
                    <Link href="/auth/register" style={{ color: "white", fontWeight: 700, textDecoration: "underline" }}>
                        Regístrate
                    </Link>
                </p>
            )}
        </div>
    );
}
