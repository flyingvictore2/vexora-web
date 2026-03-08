"use client";

import React from "react";

export default function MaintenancePage({ time = "30 MINUTOS" }: { time?: string }) {
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
            padding: "2rem"
        }}>
            <div style={{
                fontSize: "5rem",
                marginBottom: "2rem"
            }}>
                🛠️
            </div>
            <h1 style={{
                fontSize: "3rem",
                fontWeight: "900",
                marginBottom: "1rem",
                letterSpacing: "-2px"
            }}>
                ESTAMOS EN MANTENIMIENTO
            </h1>
            <p style={{
                fontSize: "1.2rem",
                color: "#94a3b8",
                maxWidth: "600px",
                lineHeight: "1.6"
            }}>
                Estamos realizando unas mejoras en la plataforma para ofrecerte la mejor experiencia posible.
                Volveremos muy pronto. ¡Gracias por tu paciencia!
            </p>
            <div style={{
                marginTop: "3rem",
                padding: "2rem",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "20px",
                backgroundColor: "rgba(255,255,255,0.02)"
            }}>
                <p style={{ color: "var(--primary)", fontWeight: "700" }}>
                    TIEMPO ESTIMADO: <span style={{ color: "white" }}>{time}</span>
                </p>
            </div>
        </div>
    );
}
