"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: "700",
                letterSpacing: "0.5px", textTransform: "uppercase",
                background: "none", border: "none", cursor: "pointer",
                padding: "0 0 1.5rem 0",
                transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
            ← Volver
        </button>
    );
}
