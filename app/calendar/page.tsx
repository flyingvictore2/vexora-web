"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Release {
    id: string;
    title: string;
    releaseDate: string;
    type: string;
}

const TYPE_COLORS: Record<string, string> = {
    MOVIE: "#2563eb",
    SERIE: "#7c3aed",
    ANIME: "#db2777",
    DOCUMENTAL: "#d97706",
};

const TYPE_ICONS: Record<string, string> = {
    MOVIE: "🎬",
    SERIE: "📺",
    ANIME: "⛩️",
    DOCUMENTAL: "🎥",
};

export default function CalendarPage() {
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/calendar?month=${month}&year=${year}`);
                setReleases(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, [month, year]);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const monthNames = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];

    const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getReleasesForDay = (day: number) => {
        return releases.filter(r => {
            if (!r.releaseDate) return false;
            const d = new Date(r.releaseDate);
            return d.getUTCDate() === day && d.getUTCMonth() === month && d.getUTCFullYear() === year;
        });
    };

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prevMonthDays = Array.from({ length: startOffset }, (_, i) => {
        const lastDayPrev = new Date(year, month, 0).getDate();
        return lastDayPrev - startOffset + i + 1;
    });

    return (
        <div style={{ padding: "2rem", backgroundColor: "#0b0c10", minHeight: "80vh", paddingBottom: "4rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ color: "white", fontSize: "2.5rem", fontWeight: "900", marginBottom: "0.5rem" }}>
                    CALENDARIO DE ESTRENOS
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Próximas películas, series y capítulos programados</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "1.5rem" }}>
                    <button onClick={goToPrevMonth} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem" }}>
                        ‹
                    </button>
                    <h2 style={{ color: "#3b82f6", minWidth: "220px", margin: 0, fontSize: "1.5rem", fontWeight: "800" }}>
                        {monthNames[month]} {year}
                    </h2>
                    <button onClick={goToNextMonth} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "1.1rem" }}>
                        ›
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "2rem", flexWrap: "wrap" }}>
                {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: TYPE_COLORS[type] }}>
                        <span>{icon}</span>
                        <span style={{ fontWeight: "700" }}>{type === "MOVIE" ? "Película" : type === "SERIE" ? "Serie" : type === "ANIME" ? "Anime" : "Documental"}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", color: "white" }}>
                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(day => (
                    <div key={day} style={{ fontWeight: "800", color: "#3b82f6", textAlign: "center", padding: "10px", fontSize: "0.8rem" }}>{day}</div>
                ))}

                {prevMonthDays.map((d, i) => (
                    <div key={`prev-${i}`} style={{ minHeight: "110px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)", opacity: 0.25 }}>
                        <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{d}</div>
                    </div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayReleases = getReleasesForDay(day);
                    const todayHighlight = isToday(day);

                    return (
                        <div key={i} style={{
                            minHeight: "110px",
                            padding: "10px",
                            backgroundColor: todayHighlight ? "rgba(59, 130, 246, 0.12)" : "rgba(255,255,255,0.02)",
                            borderRadius: "10px",
                            border: `1px solid ${todayHighlight ? "rgba(59, 130, 246, 0.5)" : "rgba(255,255,255,0.06)"}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            transition: "all 0.2s"
                        }}>
                            <div style={{
                                fontWeight: "900",
                                fontSize: "1rem",
                                color: todayHighlight ? "#3b82f6" : "rgba(255,255,255,0.6)",
                                marginBottom: "4px"
                            }}>
                                {day}
                                {todayHighlight && <span style={{ marginLeft: "4px", fontSize: "0.6rem", backgroundColor: "#3b82f6", color: "white", padding: "1px 6px", borderRadius: "10px", verticalAlign: "middle" }}>HOY</span>}
                            </div>
                            {dayReleases.map(r => (
                                <Link
                                    key={r.id}
                                    href={`/title/${r.id}`}
                                    style={{
                                        fontSize: "0.7rem",
                                        padding: "4px 7px",
                                        backgroundColor: `${TYPE_COLORS[r.type] || "#2563eb"}22`,
                                        borderRadius: "5px",
                                        color: TYPE_COLORS[r.type] || "#3b82f6",
                                        border: `1px solid ${TYPE_COLORS[r.type] || "#2563eb"}44`,
                                        fontWeight: "700",
                                        textDecoration: "none",
                                        display: "block",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}
                                    title={r.title}
                                >
                                    {TYPE_ICONS[r.type] || "🎬"} {r.title}
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Upcoming events list */}
            {releases.length > 0 && (
                <div style={{ marginTop: "3rem" }}>
                    <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem" }}>
                        📅 Estrenos este mes ({releases.length})
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                        {releases
                            .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
                            .map(r => {
                                const relDate = new Date(r.releaseDate);
                                const dayNum = relDate.getUTCDate();
                                return (
                                    <Link key={r.id} href={`/title/${r.id}`} style={{ textDecoration: "none" }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            padding: "14px 16px",
                                            backgroundColor: "rgba(255,255,255,0.03)",
                                            borderRadius: "10px",
                                            border: `1px solid ${TYPE_COLORS[r.type] || "#2563eb"}33`,
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}>
                                            <div style={{
                                                minWidth: "46px",
                                                height: "46px",
                                                backgroundColor: `${TYPE_COLORS[r.type] || "#2563eb"}22`,
                                                borderRadius: "8px",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: TYPE_COLORS[r.type] || "#3b82f6",
                                                fontWeight: "900",
                                                fontSize: "1.1rem"
                                            }}>
                                                {dayNum}
                                            </div>
                                            <div>
                                                <div style={{ color: "white", fontWeight: "700", fontSize: "0.9rem" }}>{r.title}</div>
                                                <div style={{ color: TYPE_COLORS[r.type] || "#3b82f6", fontSize: "0.75rem", fontWeight: "600", marginTop: "2px" }}>
                                                    {TYPE_ICONS[r.type]} {r.type === "MOVIE" ? "Película" : r.type === "SERIE" ? "Serie" : r.type === "ANIME" ? "Anime" : "Documental"}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            )}

            {!loading && releases.length === 0 && (
                <div style={{ textAlign: "center", padding: "5rem", color: "#64748b" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Sin estrenos programados este mes</div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Los administradores pueden programar contenido desde el panel de gestión.</div>
                </div>
            )}
        </div>
    );
}
