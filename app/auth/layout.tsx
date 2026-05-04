import React from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{
            minHeight: "100vh",
            width: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            /* Fondo tipo Netflix: oscuro con gradiente radial sutil */
            background: `
                radial-gradient(ellipse at 20% 50%, rgba(229,9,20,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(229,9,20,0.05) 0%, transparent 50%),
                #0b0c10
            `,
            overflow: "hidden",
        }}>
            {/* Grid de películas simulado como fondo (efecto Netflix) */}
            <div style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gridTemplateRows: "repeat(5, 1fr)",
                gap: "4px",
                opacity: 0.07,
                transform: "scale(1.05)",
                pointerEvents: "none",
                zIndex: 0,
            }}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{
                        background: `hsl(${(i * 37) % 360}, 30%, ${15 + (i % 4) * 5}%)`,
                        borderRadius: "2px",
                    }} />
                ))}
            </div>

            {/* Overlay oscuro sobre el grid */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(11,12,16,0.82)",
                backdropFilter: "blur(1px)",
                zIndex: 1,
            }} />

            {/* Logo en la esquina superior izquierda (estilo Netflix) */}
            <div style={{
                position: "absolute",
                top: "28px",
                left: "40px",
                zIndex: 10,
                fontSize: "1.8rem",
                fontWeight: 900,
                color: "#e50914",
                letterSpacing: "2px",
                fontFamily: "inherit",
            }}>
                ANTIGRA
            </div>

            {/* Contenido (form) */}
            <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>
                {children}
            </div>
        </div>
    );
}
