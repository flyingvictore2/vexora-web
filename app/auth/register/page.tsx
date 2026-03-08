"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [allowRegister, setAllowRegister] = useState(true);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetch("/api/config").then(res => res.json()).then(data => {
            setAllowRegister(data.allowNewRegistrations);
        }).finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/auth/register", {
                email,
                password
            });
            router.push("/auth/login");
        } catch (error: any) {
            setError(error.response?.data || "Ocurrió un error al registrarte");
        }
    };

    if (loading) return null;

    if (!allowRegister) {
        return (
            <div style={{
                backgroundColor: "#111827",
                padding: "40px",
                borderRadius: "12px",
                color: "white",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.05)"
            }}>
                <h2 style={{ marginBottom: "20px" }}>Registros Desactivados</h2>
                <p style={{ color: "#94a3b8", marginBottom: "30px" }}>Actualmente no estamos aceptando nuevos usuarios. Por favor, vuelve a intentarlo más tarde.</p>
                <Link href="/auth/login" style={{ color: "#2563eb", fontWeight: "700" }}>Volver al Inicio Sesión</Link>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: "#111827",
            padding: "40px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.05)"
        }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>
                    <span style={{ color: '#2563eb', marginRight: '8px' }}>●</span> Series.ly
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", opacity: 0.9 }}>Crea tu cuenta</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: '#ef4444', padding: "12px", borderRadius: "8px", fontSize: "13px", border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>EMAIL O USUARIO</label>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>CONTRASEÑA</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
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
                    className="btn btn-primary"
                    style={{
                        padding: "14px",
                        fontSize: "14px",
                        borderRadius: "8px",
                        marginTop: "10px",
                    }}
                >
                    REGISTRARSE
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: "24px", fontSize: '12px', color: '#94a3b8' }}>
                ¿Ya tienes una cuenta? <Link href="/auth/login" style={{ color: "#2563eb", fontWeight: "700" }}>Inicia sesión</Link>
            </div>
        </div>
    );
}
