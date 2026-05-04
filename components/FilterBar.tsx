"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

interface FilterBarProps {
    genres: string[];
    years: number[];
    currentGenre?: string;
    currentYear?: string;
    currentSort?: string;
}

const SORT_OPTIONS = [
    { value: "", label: "Más recientes" },
    { value: "oldest", label: "Más antiguos" },
    { value: "rating", label: "Mejor valorados" },
    { value: "az", label: "A → Z" },
];

export default function FilterBar({ genres, years, currentGenre = "", currentYear = "", currentSort = "" }: FilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const update = (key: string, value: string) => {
        const params = new URLSearchParams();
        if (key !== "genre" && currentGenre) params.set("genre", currentGenre);
        if (key !== "year" && currentYear) params.set("year", currentYear);
        if (key !== "sort" && currentSort) params.set("sort", currentSort);
        if (value) params.set(key, value);
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    };

    const clear = () => router.push(pathname);

    const hasFilters = currentGenre || currentYear || currentSort;

    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: "6px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700",
        cursor: "pointer", transition: "all 0.15s", border: "none",
        backgroundColor: active ? "var(--primary)" : "rgba(255,255,255,0.07)",
        color: active ? "white" : "rgba(255,255,255,0.6)",
        boxShadow: active ? "0 2px 12px rgba(229,9,20,0.3)" : "none",
        flexShrink: 0,
    });

    return (
        <div style={{ marginBottom: "2rem" }}>
            {/* Géneros */}
            {genres.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase", marginRight: "10px" }}>
                        Género
                    </span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                        <button style={chipStyle(!currentGenre)} onClick={() => update("genre", "")}>Todos</button>
                        {genres.map(g => (
                            <button key={g} style={chipStyle(currentGenre === g)} onClick={() => update("genre", currentGenre === g ? "" : g)}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Año + Orden */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Año
                </span>
                <select
                    value={currentYear}
                    onChange={e => update("year", e.target.value)}
                    style={{
                        padding: "7px 12px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600",
                        backgroundColor: currentYear ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.07)",
                        border: currentYear ? "1px solid rgba(229,9,20,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        color: "white", outline: "none", cursor: "pointer",
                    }}
                >
                    <option value="">Todos los años</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>
                    Orden
                </span>
                <select
                    value={currentSort}
                    onChange={e => update("sort", e.target.value)}
                    style={{
                        padding: "7px 12px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600",
                        backgroundColor: currentSort ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.07)",
                        border: currentSort ? "1px solid rgba(229,9,20,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        color: "white", outline: "none", cursor: "pointer",
                    }}
                >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {hasFilters && (
                    <button
                        onClick={clear}
                        style={{
                            padding: "7px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "700",
                            backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseOver={e => e.currentTarget.style.color = "white"}
                        onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                    >
                        ✕ Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
