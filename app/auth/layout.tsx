import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            minHeight: "100vh",
            width: "100%",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 20px",
            background: `
                radial-gradient(ellipse at 15% 40%, rgba(99,102,241,0.18) 0%, transparent 55%),
                radial-gradient(ellipse at 85% 70%, rgba(139,92,246,0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%),
                #08090d
            `,
            boxSizing: "border-box",
        }}>
            {/* Partículas de fondo - líneas diagonales sutiles */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                    repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 60px,
                        rgba(99,102,241,0.025) 60px,
                        rgba(99,102,241,0.025) 61px
                    )
                `,
                zIndex: 0,
                pointerEvents: "none",
            }} />

            {/* Orbe brillante superior izquierda */}
            <div style={{
                position: "absolute",
                top: "-120px",
                left: "-80px",
                width: "420px",
                height: "420px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 0,
            }} />

            {/* Orbe inferior derecha */}
            <div style={{
                position: "absolute",
                bottom: "-100px",
                right: "-60px",
                width: "380px",
                height: "380px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 0,
            }} />

            {/* Contenido */}
            <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>
                {children}
            </div>
        </div>
    );
}
