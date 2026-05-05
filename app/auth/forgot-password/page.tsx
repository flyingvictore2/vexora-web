"use client";

import React, { useState } from "react";
import Link from "next/link";

const INDIGO = "#6366f1";
const INDIGO_DARK = "#4f46e5";
const INDIGO_GLOW = "rgba(99,102,241,0.35)";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Usa un correo válido");
            setStatus("success");
            setMessage(data.message);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
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
                marginBottom: "8px",
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
                letterSpacing: "0.3px",
            }}>
                Recuperar contraseña
            </h2>
            <p style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "28px",
                lineHeight: 1.5,
            }}>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {status === "success" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div style={{
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        width: "100%",
                    }}>
                        <div style={{ fontSize: "28px", marginBottom: "10px" }}>✉️</div>
                        <p style={{ fontSize: "14px", color: "#10b981", fontWeight: 600, marginBottom: "8px" }}>{message}</p>
                        <p style={{ fontSize: "12px", color: "#6b7280" }}>Revisa también tu carpeta de spam.</p>
                    </div>
                    <Link href="/auth/login" style={{
                        width: "100%",
                        padding: "14px",
                        background: `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                        borderRadius: "10px",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 700,
                        textAlign: "center",
                        textDecoration: "none",
                        letterSpacing: "0.8px",
                        textTransform: "uppercase",
                        boxShadow: `0 4px 20px rgba(99,102,241,0.4)`,
                        display: "block",
                    }}>
                        Volver al inicio de sesión
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {status === "error" && (
                        <div style={{
                            background: "rgba(239,68,68,0.08)",
                            color: "#fca5a5",
                            padding: "11px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            border: "1px solid rgba(239,68,68,0.2)",
                        }}>
                            {message}
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

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        style={{
                            width: "100%",
                            padding: "14px",
                            background: status === "loading"
                                ? INDIGO_DARK
                                : `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                            border: "none",
                            borderRadius: "10px",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: status === "loading" ? "not-allowed" : "pointer",
                            marginTop: "4px",
                            letterSpacing: "0.8px",
                            fontFamily: "inherit",
                            transition: "opacity 0.2s, transform 0.1s",
                            boxShadow: status === "loading" ? "none" : `0 4px 20px rgba(99,102,241,0.4)`,
                            textTransform: "uppercase",
                        }}
                        onMouseEnter={e => { if (status !== "loading") e.currentTarget.style.opacity = "0.9"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                        onMouseDown={e => { if (status !== "loading") e.currentTarget.style.transform = "scale(0.98)"; }}
                        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        {status === "loading" ? "Enviando..." : "Enviar enlace"}
                    </button>

                    <p style={{ textAlign: "center", marginTop: "8px", fontSize: "13px", color: "#4b5563" }}>
                        <Link href="/auth/login" style={{ color: "#a5b4fc", fontWeight: 700 }}>
                            Volver a iniciar sesión
                        </Link>
                    </p>
                </form>
            )}
        </div>
    );
}
