"use client";

import React, { useState } from "react";
import Link from "next/link";

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

            if (!res.ok) {
                throw new Error(data.error || "Usa un correo válido");
            }

            setStatus("success");
            setMessage(data.message);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
        }
    };

    return (
        <div style={{
            backgroundColor: "#111827",
            padding: "40px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.05)",
            maxWidth: "400px",
            width: "100%",
            margin: "0 auto",
            marginTop: "10vh"
        }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>
                    <span style={{ color: '#2563eb', marginRight: '8px' }}>●</span> Series.ly
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", opacity: 0.9 }}>Recuperar Contraseña</h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                    Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
            </div>

            {status === "success" ? (
                <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#10b981', fontSize: '24px', marginBottom: '8px' }}>✉️</div>
                    <p style={{ fontSize: '14px', color: '#10b981', fontWeight: '600', marginBottom: '16px' }}>{message}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Revisa también tu bandeja de spam si no lo encuentras.</p>
                    <Link href="/auth/login" className="btn btn-primary" style={{ display: 'block', padding: '12px', borderRadius: '8px', textDecoration: 'none' }}>
                        Volver al inicio de sesión
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {status === "error" && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: '#ef4444', padding: "12px", borderRadius: "8px", fontSize: "13px", border: '1px solid rgba(239, 68, 68, 0.2)' }}>{message}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>CORREO ELECTRÓNICO</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: "#1f2937",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                color: "white",
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="btn btn-primary"
                        style={{
                            padding: "14px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            marginTop: "10px",
                            opacity: status === "loading" ? 0.7 : 1
                        }}
                    >
                        {status === "loading" ? "ENVIANDO..." : "ENVIAR ENLACE"}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: "10px", fontSize: '12px', color: '#94a3b8' }}>
                        <Link href="/auth/login" style={{ color: "#2563eb", fontWeight: "600" }}>Volver a iniciar sesión</Link>
                    </div>
                </form>
            )}
        </div>
    );
}
