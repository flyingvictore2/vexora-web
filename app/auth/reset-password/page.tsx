"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setStatus("error");
            setMessage("Enlace inválido o sin token.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setStatus("error");
            setMessage("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al restablecer contraseña");
            }

            setStatus("success");
            setMessage(data.message);

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push("/auth/login");
            }, 3000);

        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
        }
    };

    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px' }}>⚠️</div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Enlace Inválido</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Falta el token de seguridad en la URL.</p>
                <Link href="/auth/forgot-password" style={{ color: '#2563eb' }}>Solicitar nuevo enlace</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {status === "success" && <div style={{ background: "rgba(16, 185, 129, 0.1)", color: '#10b981', padding: "12px", borderRadius: "8px", fontSize: "13px", border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>{message}<br /><span style={{ fontSize: '11px' }}>Redirigiendo...</span></div>}
            {status === "error" && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: '#ef4444', padding: "12px", borderRadius: "8px", fontSize: "13px", border: '1px solid rgba(239, 68, 68, 0.2)' }}>{message}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>NUEVA CONTRASEÑA</label>
                <div style={{ position: 'relative' }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                            width: "100%",
                            padding: "12px",
                            paddingRight: '40px',
                            backgroundColor: "#1f2937",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "white",
                        }}
                        disabled={status === "success"}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>CONFIRMAR CONTRASEÑA</label>
                <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "white",
                    }}
                    disabled={status === "success"}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="btn btn-primary"
                style={{
                    padding: "14px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    marginTop: "10px",
                    opacity: (status === "loading" || status === "success") ? 0.7 : 1
                }}
            >
                {status === "loading" ? "GUARDANDO..." : "CAMBIAR CONTRASEÑA"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                <h2 style={{ fontSize: "20px", fontWeight: "700", opacity: 0.9 }}>Nueva Contraseña</h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                    Introduce tu nueva contraseña. Asegúrate de que tenga al menos 6 caracteres.
                </p>
            </div>

            <Suspense fallback={<div style={{ textAlign: 'center', color: '#64748b' }}>Cargando...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
