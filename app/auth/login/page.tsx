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
    const [showPassword, setShowPassword] = useState(false);
    const [allowRegister, setAllowRegister] = useState(true);

    React.useEffect(() => {
        fetch("/api/config").then(res => res.json()).then(data => {
            setAllowRegister(data.allowNewRegistrations);
        }).catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                setError("Correo o contraseña incorrectos");
                return;
            }

            router.push("/profiles");
        } catch (error) {
            console.log(error);
        }
    };

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
                <h2 style={{ fontSize: "20px", fontWeight: "700", opacity: 0.9 }}>Iniciar sesión</h2>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', textAlign: 'center' }}>Inicia sesión o regístrate con:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button className="social-btn" style={{
                        padding: '8px',
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                    }}>
                        <span style={{ color: '#ea4335' }}>G</span> Google
                    </button>
                    <button className="social-btn" style={{
                        padding: '8px',
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                    }}>
                        <span style={{ color: '#5865f2' }}>D</span> Discord
                    </button>
                    <button className="social-btn" style={{
                        padding: '8px',
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                    }}>
                        <span style={{ color: '#9146ff' }}>T</span> Twitch
                    </button>
                </div>
            </div>

            <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ position: 'relative', backgroundColor: '#111827', padding: '0 10px', fontSize: '11px', color: '#64748b' }}>O continuar con</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>CONTRASEÑA</label>
                        <Link href="/auth/forgot-password" style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>¿Olvidaste tu contraseña?</Link>
                    </div>
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
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, cursor: 'pointer' }}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ color: '#10b981' }}>✅</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>¡Operación exitosa!</p>
                        <p style={{ fontSize: '9px', color: '#64748b' }}>Cloudflare Verification Pass</p>
                    </div>
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
                    INICIAR SESIÓN
                </button>
            </form>

            {allowRegister && (
                <div style={{ textAlign: 'center', marginTop: "24px", fontSize: '12px', color: '#94a3b8' }}>
                    ¿No tienes una cuenta? <Link href="/auth/register" style={{ color: "#2563eb", fontWeight: "700" }}>Regístrate</Link>
                </div>
            )}
        </div>
    );
}
