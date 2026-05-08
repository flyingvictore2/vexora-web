"use client";

import React, { useState, useEffect } from "react";

export default function TitleActions({ movieId }: { movieId: string }) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) return;
        fetch(`/api/hidden?profileId=${profileId}`)
            .then(r => r.json())
            .then((ids: string[]) => setIsHidden(Array.isArray(ids) && ids.includes(movieId)))
            .catch(() => {});
    }, [movieId]);

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

    const toggleHidden = async () => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId || busy) return;
        setBusy(true);
        const next = !isHidden;
        await fetch("/api/hidden", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId, movieId, hidden: next }),
        });
        setIsHidden(next);
        flash(next ? "Ocultado del inicio" : "Visible en el inicio ✓");
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
            <button
                onClick={toggleHidden}
                disabled={busy}
                style={{
                    ...btnStyle,
                    background: isHidden ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)",
                    borderColor: isHidden ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)",
                    color: isHidden ? "#34d399" : "white",
                }}
            >
                {isHidden ? "👁️ Mostrar en inicio" : "🙈 No me interesa"}
            </button>
            {msg && <span style={{ fontSize: "0.78rem", color: "#34d399", fontWeight: "700" }}>{msg}</span>}
        </>
    );
}
