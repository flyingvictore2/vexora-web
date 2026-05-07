"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const INDIGO = "#6366f1";
const INDIGO_GLOW = "rgba(99,102,241,0.35)";

function inputStyle(focused: boolean, state?: "ok" | "error"): React.CSSProperties {
    return {
        width: "100%", padding: "13px 16px",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: `1px solid ${state === "ok" ? "rgba(16,185,129,0.5)" : state === "error" ? "rgba(239,68,68,0.5)" : focused ? INDIGO : "rgba(255,255,255,0.1)"}`,
        boxShadow: focused ? `0 0 0 3px ${INDIGO_GLOW}` : "none",
        borderRadius: "10px", color: "white", fontSize: "15px",
        outline: "none", fontFamily: "inherit", transition: "all 0.2s",
    };
}

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700, color: "#6b7280",
    marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase",
};

export default function ChooseUsernamePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [focused, setFocused] = useState(false);
    const [usernameState, setUsernameState] = useState<"idle" | "checking" | "ok" | "error">("idle");
    const [usernameMsg, setUsernameMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const checkTimer = useRef<NodeJS.Timeout | null>(null);

    // Auth guard + redirect if username already set
    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") {
            router.replace("/auth/login");
            return;
        }
        const u = (session?.user as any)?.username;
        if (u) {
            router.replace("/profiles");
        }
    }, [status, session, router]);

    // Debounced availability check
    useEffect(() => {
        if (!username) { setUsernameState("idle"); setUsernameMsg(""); return; }
        setUsernameState("checking");
        if (checkTimer.current) clearTimeout(checkTimer.current);
        checkTimer.current = setTimeout(async () => {
            try {
                const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
                const d = await r.json();
                if (d.available) { setUsernameState("ok"); setUsernameMsg("¡Disponible!"); }
                else { setUsernameState("error"); setUsernameMsg(d.error || "No disponible"); }
            } catch { setUsernameState("error"); setUsernameMsg("Error al comprobar"); }
        }, 450);
        return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usernameState !== "ok") { setError("Elige un nombre de usuario disponible"); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/auth/set-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "No se pudo guardar el nombre de usuario"); return; }
            // Full reload so the JWT is refreshed with the new username
            window.location.href = "/profiles";
        } catch {
            setError("Ocurrió un error. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton while session resolves
    if (status === "loading") {
        return (
            <div style={cardStyle}>
                <Logo />
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                    Cargando…
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <Logo />
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
                Elige tu nombre de usuario
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "28px", lineHeight: 1.5 }}>
                Este nombre es único y se usará para tu perfil social.<br />
                No podrás cambiarlo más adelante.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", padding: "11px 14px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {error}
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Nombre de usuario</label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "15px", pointerEvents: "none" }}>@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))}
                            placeholder="mi_usuario"
                            required
                            autoFocus
                            style={{ ...inputStyle(focused, usernameState === "ok" ? "ok" : usernameState === "error" ? "error" : undefined), paddingLeft: "30px", paddingRight: "36px" }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                        />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
                            {usernameState === "checking" && <span style={{ color: "#94a3b8", fontSize: "11px" }}>...</span>}
                            {usernameState === "ok" && "✅"}
                            {usernameState === "error" && "❌"}
                        </span>
                    </div>
                    {usernameMsg && (
                        <p style={{ fontSize: "12px", marginTop: "5px", color: usernameState === "ok" ? "#34d399" : "#fca5a5" }}>
                            {usernameMsg}
                        </p>
                    )}
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                        3–20 caracteres · letras, números, punto y guión bajo
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || usernameState !== "ok"}
                    style={{
                        width: "100%", padding: "14px",
                        background: loading || usernameState !== "ok"
                            ? "rgba(99,102,241,0.4)"
                            : `linear-gradient(135deg, ${INDIGO} 0%, #7c3aed 100%)`,
                        border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: 700,
                        cursor: loading || usernameState !== "ok" ? "not-allowed" : "pointer",
                        marginTop: "4px", letterSpacing: "0.8px", fontFamily: "inherit",
                        transition: "all 0.2s", textTransform: "uppercase",
                        boxShadow: loading || usernameState !== "ok" ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                    }}
                >
                    {loading ? "Guardando..." : "Confirmar usuario"}
                </button>
            </form>
        </div>
    );
}

function Logo() {
    return (
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "4px", background: "linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                VEXORA
            </div>
            <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, transparent, #6366f1, transparent)", margin: "10px auto 0", borderRadius: "2px" }} />
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    backgroundColor: "rgba(10,10,20,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    padding: "40px 44px 36px", borderRadius: "20px", color: "white",
    border: "1px solid rgba(99,102,241,0.2)",
    boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6)",
};
