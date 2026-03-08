"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Ticket {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
}

export default function AdminSupport() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchTickets = async () => {
        try {
            const res = await axios.get("/api/admin/support");
            setTickets(res.data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            showToast("Error al cargar los mensajes", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.put("/api/admin/support", { id, status: newStatus });
            showToast(`Ticket marcado como ${newStatus}`);
            fetchTickets();
            if (selectedTicket?.id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            showToast("Error al actualizar el estado", false);
        }
    };

    const deleteTicket = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este mensaje?")) return;
        try {
            await axios.delete(`/api/admin/support?id=${id}`);
            showToast("Mensaje eliminado");
            fetchTickets();
            if (selectedTicket?.id === id) setSelectedTicket(null);
        } catch (error) {
            showToast("Error al eliminar", false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === "ALL") return true;
        return t.status === filter;
    });

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Cargando bandeja de soporte...</div>;

    return (
        <div style={{ maxWidth: "1600px" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
                    padding: "16px 24px", borderRadius: "12px", fontWeight: "700",
                    backgroundColor: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: toast.ok ? "var(--success)" : "var(--error)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                    {toast.ok ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            <header style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Bandeja de Soporte</h1>
                <p style={{ color: "var(--text-secondary)" }}>Gestiona las solicitudes y el feedback de tus usuarios.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem", height: "calc(100vh - 250px)" }}>

                {/* Sidebar - Ticket List */}
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={filterStyle}
                        >
                            <option value="ALL">Todos los mensajes</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="RESOLVED">Resueltos</option>
                            <option value="CLOSED">Cerrados</option>
                        </select>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                        {filteredTickets.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                No hay tickets aquí.
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    style={{
                                        padding: "1.25rem",
                                        borderRadius: "12px",
                                        cursor: "pointer",
                                        marginBottom: "0.5rem",
                                        transition: "all 0.2s",
                                        backgroundColor: selectedTicket?.id === ticket.id ? "rgba(255,255,255,0.08)" : "transparent",
                                        border: selectedTicket?.id === ticket.id ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
                                    }}
                                    className="ticket-item"
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ fontSize: "0.7rem", fontWeight: "800", color: ticket.status === "PENDING" ? "var(--primary)" : "var(--text-secondary)", textTransform: "uppercase" }}>
                                            {ticket.status}
                                        </span>
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: "700", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {ticket.subject}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {ticket.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main View - Ticket Detail */}
                <div className="glass-card" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                    {selectedTicket ? (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "0.5rem" }}>{selectedTicket.subject}</h2>
                                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        <span>De: <strong>{selectedTicket.name}</strong></span>
                                        <span>•</span>
                                        <span>{selectedTicket.email}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {selectedTicket.status !== "RESOLVED" && (
                                        <button onClick={() => updateStatus(selectedTicket.id, "RESOLVED")} style={btnActionStyle("var(--success)")}>Resolver</button>
                                    )}
                                    <button onClick={() => deleteTicket(selectedTicket.id)} style={btnActionStyle("#ef4444")}>Eliminar</button>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: "rgba(255,255,255,0.03)",
                                padding: "2rem",
                                borderRadius: "16px",
                                lineHeight: "1.7",
                                border: "1px solid rgba(255,255,255,0.05)",
                                flex: 1,
                                marginBottom: "2rem"
                            }}>
                                {selectedTicket.message}
                            </div>

                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "700" }}>CAMBIAR ESTADO:</span>
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                                    style={statusSelectStyle}
                                >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="RESOLVED">Resuelto</option>
                                    <option value="CLOSED">Cerrado</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", opacity: 0.5 }}>
                            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✉️</div>
                            <p style={{ fontWeight: "700" }}>Selecciona un mensaje para ver el detalle</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const filterStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 15px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "700",
    outline: "none"
};

const statusSelectStyle: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "800",
    outline: "none",
    cursor: "pointer"
};

const btnActionStyle = (color: string): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: "800",
    cursor: "pointer",
    backgroundColor: "transparent",
    border: `1px solid ${color}`,
    color: color,
    transition: "all 0.2s"
});
