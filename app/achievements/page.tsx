"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AchievementsPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [profileId, setProfileId] = useState<string | null>(null);

    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        if (!pid) { router.push("/profiles"); return; }
        setProfileId(pid);

        // Trigger a check first to update achievements/streak then fetch state
        fetch("/api/gamification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: pid }),
        })
            .then(() => fetch(`/api/gamification?profileId=${pid}`))
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
    }, [router]);

    if (!data) {
        return <div style={{ color: "white", padding: "120px", textAlign: "center" }}>Cargando...</div>;
    }

    const progressPct = data.nextLevelXp > 0
        ? Math.round((data.currentXp / data.nextLevelXp) * 100) : 0;

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem", color: "white" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", marginBottom: "1.5rem", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                ← Volver
            </button>

            {/* Profile XP card */}
            <div style={{
                padding: "2rem", marginBottom: "2.5rem",
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "20px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "1.25rem" }}>
                    <div style={{
                        width: "82px", height: "82px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", fontWeight: "900",
                        boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
                    }}>
                        {data.level}
                    </div>
                    <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Nivel</div>
                        <div style={{ fontSize: "2rem", fontWeight: "900" }}>Lvl {data.level}</div>
                        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
                            {data.totalXp} XP totales · 🔥 Racha de {data.streak} día{data.streak !== 1 ? "s" : ""}
                        </div>
                    </div>
                </div>
                <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #7c3aed)", transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", textAlign: "right" }}>
                    {data.currentXp} / {data.nextLevelXp} XP para Lvl {data.level + 1}
                </div>
            </div>

            <h2 style={{ fontSize: "1.4rem", fontWeight: "900", marginBottom: "1.25rem" }}>Logros</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "14px",
            }}>
                {data.achievements?.map((a: any) => (
                    <div key={a.code} style={{
                        padding: "1.1rem",
                        background: a.unlocked ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${a.unlocked ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: "14px",
                        opacity: a.unlocked ? 1 : 0.5,
                        position: "relative",
                    }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px", filter: a.unlocked ? "none" : "grayscale(100%)" }}>{a.icon}</div>
                        <div style={{ fontWeight: "800", fontSize: "0.95rem", marginBottom: "4px" }}>{a.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.4", marginBottom: "8px" }}>{a.description}</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: "800", color: a.unlocked ? "#34d399" : "rgba(255,255,255,0.4)", letterSpacing: "0.5px" }}>
                            {a.unlocked ? "✓ DESBLOQUEADO" : `+${a.xp} XP`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
