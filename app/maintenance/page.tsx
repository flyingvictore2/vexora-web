"use client";

import React from "react";

interface Props {
    time?: string;
    title?: string;
    message?: string;
    emoji?: string;
}

export default function MaintenancePage({
    time = "30 MINUTOS",
    title = "Próximamente",
    message = "Estamos trabajando en algo increíble. Vuelve pronto.",
    emoji = "🚀",
}: Props) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b0c10",
            color: "white",
            textAlign: "center",
            padding: "2rem",
            backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)",
        }}>
            <div style={{ fontSize: "6rem", marginBottom: "1.5rem", lineHeight: 1 }}>
                {emoji}
            </div>
            <h1 style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontWeight: "900",
                marginBottom: "1.25rem",
                letterSpacing: "-2px",
                background: "linear-gradient(135deg, #fff 40%, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
            }}>
                {title}
            </h1>
            <p style={{
                fontSize: "1.15rem",
                color: "#94a3b8",
                maxWidth: "560px",
                lineHeight: "1.7",
                marginBottom: "2.5rem",
            }}>
                {message}
            </p>
            {time && (
                <div style={{
                    padding: "14px 28px",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: "12px",
                    backgroundColor: "rgba(99,102,241,0.08)",
                }}>
                    <p style={{ color: "#818cf8", fontWeight: "800", fontSize: "0.82rem", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                        Tiempo estimado: <span style={{ color: "white" }}>{time}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
