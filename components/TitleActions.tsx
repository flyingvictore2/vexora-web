"use client";

import React, { useState } from "react";

export default function TitleActions({ movieId }: { movieId: string }) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const flash = (m: string) => {
        setMsg(m);
        setTimeout(() => setMsg(""), 2000);
    };

    const markWatched = async () => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId || busy) return;
        setBusy(true);
        await fetch("/api/watchhistory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, movieId, progress: 100 }),
        });
        flash("Marcado como visto ✓");
        setBusy(false);
    };

    const hide = async () => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId || busy) return;
        setBusy(true);
        await fetch("/api/hidden", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, movieId, hidden: true }),
        });
        flash("Ocultado del inicio");
        setBusy(false);
    };

    const btnStyle: React.CSSProperties = {
        padding: "0.55rem 1.05rem",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "white", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "700",
        cursor: "pointer", letterSpacing: "0.4px", textTransform: "uppercase",
    };

    return (
        <>
            <button onClick={markWatched} disabled={busy} style={btnStyle}>✓ Marcar visto</button>
            <button onClick={hide} disabled={busy} style={btnStyle}>🙈 No me interesa</button>
            {msg && <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: "700" }}>{msg}</span>}
        </>
    );
}
