"use client";

import React, { useState } from "react";
import axios from "axios";

export default function RequestsPage() {
    const [title, setTitle] = useState("");
    const [info, setInfo] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;
        setSending(true);
        setStatus(null);

        try {
            await axios.post("/api/requests", { title, info });
            setStatus({ msg: "¡Solicitud enviada! La revisaremos lo antes posible.", ok: true });
            setTitle("");
            setInfo("");
        } catch (error) {
            setStatus({ msg: "Error al enviar la solicitud. Intenta de nuevo.", ok: false });
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ paddingBottom: "5rem" }}>
            <div style={{
                padding: "4rem",
                backgroundColor: "rgba(17, 24, 39, 0.6)",
                backdropFilter: "blur(20px)",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                maxWidth: "800px",
                margin: "4rem auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}>
                <header style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1 style={{ color: "white", fontSize: "2.5rem", fontWeight: "900", marginBottom: "1rem", letterSpacing: "-1px" }}>SOLICITUDES DE CONTENIDO</h1>
                    <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
                        ¿No encuentras lo que buscas? Pídenoslo y lo subiremos lo antes posible.
                    </p>
                </header>

                {status && (
                    <div style={{
                        padding: "1rem",
                        borderRadius: "12px",
                        marginBottom: "2rem",
                        textAlign: "center",
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        backgroundColor: status.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${status.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                        color: status.ok ? "#10b981" : "#ef4444"
                    }}>
                        {status.ok ? "✅" : "❌"} {status.msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>TÍTULO DE LA PELÍCULA O SERIE</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Breaking Bad"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <label style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>MÁS INFORMACIÓN (OPCIONAL)</label>
                        <textarea
                            placeholder="Año, director, o cualquier detalle que nos ayude a encontrarlo..."
                            value={info}
                            onChange={(e) => setInfo(e.target.value)}
                            style={{
                                ...inputStyle,
                                minHeight: "150px",
                                resize: "none"
                            }}
                        />
                    </div>
                    <button
                        disabled={sending}
                        className="btn btn-primary"
                        style={{ height: "60px", fontSize: "1.1rem", fontWeight: "900", letterSpacing: "1px" }}
                    >
                        {sending ? "ENVIANDO..." : "ENVIAR SOLICITUD"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "1.2rem",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s ease"
};
