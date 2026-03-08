"use client";

import React, { useEffect, useState, useCallback } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const res = await fetch("/api/admin/stats");
            if (!res.ok) throw new Error("Error fetching stats");
            const data = await res.json();
            setStats(data.stats || []);
            setRecentActivity(data.recentActivity || []);
            setSystemHealth(data.systemHealth || []);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div style={{ padding: "100px", textAlign: "center" }}>
                <div style={{ color: "var(--primary)", fontSize: "1.5rem", fontWeight: "700" }}>Cargando datos maestros...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1400px" }}>
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Panel de Control</h1>
                <p style={{ color: "var(--text-secondary)" }}>Resumen operativo de la plataforma Series.ly</p>
            </header>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", marginBottom: "3rem" }}>
                {stats.length > 0 ? stats.map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: "2rem", transition: "transform 0.2s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{stat.label}</div>
                            <span style={{
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                color: "var(--success)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: "800"
                            }}>
                                {stat.change}
                            </span>
                        </div>
                        <div style={{ fontSize: "2.8rem", fontWeight: "900", color: "white" }}>{stat.value}</div>
                        <div style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>Crecimiento este mes</div>
                    </div>
                )) : (
                    <div style={{ color: "var(--text-secondary)" }}>No hay estadísticas disponibles.</div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "30px" }}>
                {/* User Activity */}
                <section className="glass-card" style={{ padding: "2.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>Actividad Reciente</h3>
                        <button
                            type="button"
                            onClick={() => fetchStats(true)}
                            style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: "700", background: "none", border: "none", cursor: "pointer", opacity: refreshing ? 0.5 : 1 }}
                            disabled={refreshing}
                        >
                            {refreshing ? "Actualizando..." : "↻ Refrescar"}
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                            <div key={i} style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                <div style={{
                                    width: "40px", height: "40px",
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    borderRadius: "10px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.2rem"
                                }}>
                                    {activity.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.95rem" }}>
                                        <span style={{ fontWeight: "700", color: "white" }}>{activity.user}</span>
                                        <span style={{ color: "var(--text-secondary)", marginLeft: "6px" }}>{activity.action}</span>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                                        {new Date(activity.time).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>No hay actividad reciente.</div>
                        )}
                    </div>
                </section>

                {/* System Health */}
                <section className="glass-card" style={{ padding: "2.5rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "2rem" }}>Salud del Sistema</h3>
                    {systemHealth.length > 0 ? systemHealth.map((item) => (
                        <div key={item.label} style={{ marginBottom: "1.8rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "0.9rem" }}>
                                <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>{item.label}</span>
                                <span style={{ fontWeight: "800", color: "white" }}>{item.value}</span>
                            </div>
                            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                <div style={{ width: `${item.percentage}%`, height: "100%", backgroundColor: item.color, borderRadius: "4px", transition: "width 1s ease-out" }}></div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Monitor de salud inactivo.</div>
                    )}
                    <div style={{ marginTop: "2rem", padding: "15px", backgroundColor: "rgba(16, 185, 129, 0.05)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                        <span style={{ color: "var(--success)", fontSize: "0.8rem", fontWeight: "700" }}>● Todos los sistemas operativos</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
