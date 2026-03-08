"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface ContentRequest {
    id: string;
    title: string;
    info: string;
    status: string;
    userEmail: string | null;
    createdAt: string;
}

export default function AdminRequests() {
    const [requests, setRequests] = useState<ContentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get("/api/admin/requests");
            setRequests(res.data);
        } catch (error) {
            console.error("Error fetching requests:", error);
            showToast("Error al cargar las solicitudes", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.put("/api/admin/requests", { id, status: newStatus });
            showToast(`Estado actualizado a ${newStatus}`);
            fetchRequests();
        } catch (error) {
            showToast("Error al actualizar", false);
        }
    };

    const deleteRequest = async (id: string) => {
        if (!confirm("¿Borrar esta solicitud?")) return;
        try {
            await axios.delete(`/api/admin/requests?id=${id}`);
            showToast("Solicitud eliminada");
            fetchRequests();
        } catch (error) {
            showToast("Error al eliminar", false);
        }
    };

    const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Cargando solicitudes...</div>;

    return (
        <div style={{ maxWidth: "1400px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
                    padding: "16px 24px", borderRadius: "12px", fontWeight: "700",
                    backgroundColor: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: toast.ok ? "var(--success)" : "var(--error)",
                    backdropFilter: "blur(10px)",
                }}>
                    {toast.ok ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Solicitudes de Contenido</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Lo que tus usuarios quieren ver en el sitio.</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="ALL">Todo</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="ACCEPTED">Aceptadas</option>
                        <option value="COMPLETED">Completadas</option>
                        <option value="REJECTED">Rechazadas</option>
                    </select>
                </div>
            </header>

            <div className="glass-card" style={{ padding: "1.5rem", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
                    <thead>
                        <tr style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                            <th style={thStyle}>Título</th>
                            <th style={thStyle}>Info / Notas</th>
                            <th style={thStyle}>Usuario</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Fecha</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map(req => (
                            <tr key={req.id} style={trStyle}>
                                <td style={{ ...tdStyle, fontWeight: "800", color: "white" }}>{req.title}</td>
                                <td style={{ ...tdStyle, color: "var(--text-secondary)", maxWidth: "300px", fontSize: "0.85rem" }}>
                                    {req.info || "-"}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "0.85rem" }}>{req.userEmail || "Anónimo"}</td>
                                <td style={tdStyle}>
                                    <span style={statusBadgeStyle(req.status)}>
                                        {req.status}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                        <select
                                            value={req.status}
                                            onChange={(e) => updateStatus(req.id, e.target.value)}
                                            style={miniSelectStyle}
                                        >
                                            <option value="PENDING">Pendiente</option>
                                            <option value="ACCEPTED">Aceptar</option>
                                            <option value="COMPLETED">Completada</option>
                                            <option value="REJECTED">Rechazar</option>
                                        </select>
                                        <button onClick={() => deleteRequest(req.id)} style={btnDelStyle}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRequests.length === 0 && (
                    <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay solicitudes que coincidan con el filtro.
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 20px", fontWeight: "800" };
const tdStyle: React.CSSProperties = { padding: "15px 20px", verticalAlign: "middle" };
const trStyle: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px" };

const selectStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "white",
    fontWeight: "700",
    outline: "none",
    cursor: "pointer"
};

const miniSelectStyle: React.CSSProperties = {
    padding: "5px 10px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "0.8rem",
    fontWeight: "700",
    outline: "none"
};

const btnDelStyle: React.CSSProperties = {
    padding: "5px 10px",
    backgroundColor: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s"
};

const statusBadgeStyle = (status: string): React.CSSProperties => {
    const colors: any = {
        PENDING: { bg: "rgba(245,158,11,0.1)", c: "#f59e0b" },
        ACCEPTED: { bg: "rgba(37,99,235,0.1)", c: "#3b82f6" },
        COMPLETED: { bg: "rgba(16,185,129,0.1)", c: "#10b981" },
        REJECTED: { bg: "rgba(239,68,68,0.1)", c: "#ef4444" }
    };
    const style = colors[status] || colors.PENDING;
    return {
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "0.7rem",
        fontWeight: "900",
        backgroundColor: style.bg,
        color: style.c,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    };
};
