"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PLANS = ["", "FREE", "BASIC", "STANDARD", "PREMIUM"];
const TYPES = [
    { id: "", label: "Todos" },
    { id: "MOVIE", label: "Películas" },
    { id: "SERIE", label: "Series" },
    { id: "ANIME", label: "Anime" },
];

export default function DiscoverPage() {
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [top, setTop] = useState<any[]>([]);
    const [filters, setFilters] = useState({ q: "", genre: "", year: "", plan: "", contentType: "" });
    const [loading, setLoading] = useState(false);

    const applyFilters = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
        const r = await fetch(`/api/discover?${params}`);
        setResults(await r.json());
        setLoading(false);
    };

    useEffect(() => {
        // Top 10 on load
        fetch("/api/discover?type=top").then(r => r.json()).then(setTop);
        applyFilters();
    }, []);

    const surprise = async () => {
        const r = await fetch("/api/discover?type=random");
        const data = await r.json();
        if (data[0]) {
            const m = data[0];
            const href = (m.type === "SERIE" || m.type === "ANIME") ? `/series/${m.id}` : `/title/${m.id}`;
            router.push(href);
        }
    };

    return (
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem 1.5rem", color: "white" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ← Volver
            </button>

            <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "1rem" }}>Descubrir</h1>

            <button onClick={surprise} style={{
                marginBottom: "2rem", padding: "10px 22px",
                background: "linear-gradient(135deg, #6366f1, #ec4899)",
                color: "white", border: "none", borderRadius: "8px",
                fontWeight: "800", fontSize: "0.85rem", cursor: "pointer",
                letterSpacing: "0.5px", textTransform: "uppercase",
            }}>
                🎲 Sorpréndeme
            </button>

            {/* TOP 10 */}
            {top.length > 0 && (
                <section style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "1rem" }}>🔥 Top 10 hoy</h2>
                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
                        {top.map((m: any, i: number) => {
                            const href = (m.type === "SERIE" || m.type === "ANIME") ? `/series/${m.id}` : `/title/${m.id}`;
                            return (
                                <Link key={m.id} href={href} style={{ flex: "0 0 auto", width: "200px", textDecoration: "none", color: "white", position: "relative" }}>
                                    <div style={{ position: "absolute", top: "-15px", left: "-15px", fontSize: "5rem", fontWeight: "900", color: "rgba(99,102,241,0.7)", lineHeight: 1, zIndex: 2, WebkitTextStroke: "2px rgba(0,0,0,0.5)" } as any}>
                                        {i + 1}
                                    </div>
                                    <div style={{ aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", background: "#1e293b" }}>
                                        <img src={m.thumbnailUrl} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: "700", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Filters */}
            <section style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px",
            }}>
                <input
                    placeholder="Buscar por título…"
                    value={filters.q}
                    onChange={e => setFilters({ ...filters, q: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && applyFilters()}
                    style={inputStyle}
                />
                <input
                    placeholder="Género"
                    value={filters.genre}
                    onChange={e => setFilters({ ...filters, genre: e.target.value })}
                    style={inputStyle}
                />
                <input
                    placeholder="Año"
                    value={filters.year}
                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                    style={inputStyle}
                />
                <select value={filters.plan} onChange={e => setFilters({ ...filters, plan: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="" style={{ color: "black" }}>Todos los planes</option>
                    {PLANS.filter(Boolean).map(p => <option key={p} value={p} style={{ color: "black" }}>{p}</option>)}
                </select>
                <select value={filters.contentType} onChange={e => setFilters({ ...filters, contentType: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    {TYPES.map(t => <option key={t.id} value={t.id} style={{ color: "black" }}>{t.label}</option>)}
                </select>
                <button onClick={applyFilters} style={{
                    background: "var(--primary, #6366f1)", color: "white",
                    border: "none", borderRadius: "8px", fontWeight: "800",
                    cursor: "pointer", padding: "10px", fontSize: "0.85rem", letterSpacing: "0.5px", textTransform: "uppercase",
                }}>Aplicar</button>
            </section>

            {/* Results */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)" }}>Buscando...</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                    {results.map((m: any) => {
                        const href = (m.type === "SERIE" || m.type === "ANIME") ? `/series/${m.id}` : `/title/${m.id}`;
                        return (
                            <Link key={m.id} href={href} style={{ textDecoration: "none", color: "white" }}>
                                <div style={{ aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", background: "#1e293b", marginBottom: "8px" }}>
                                    <img src={m.thumbnailUrl} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                                <div style={{ fontSize: "0.88rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{m.year} · ★ {m.rating}</div>
                            </Link>
                        );
                    })}
                    {results.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)" }}>
                            Sin resultados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white", fontSize: "0.85rem", outline: "none",
};
