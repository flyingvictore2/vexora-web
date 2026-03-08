"use client";

import React, { useEffect, useState } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    subscription?: {
        plan: string;
        status: string;
    } | null;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Error fetching");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CHANGE_ROLE", userId, role: newRole }),
            });
            if (!res.ok) throw new Error("Failed");
            showToast(`Rol cambiado a ${newRole} correctamente`);
            fetchUsers();
        } catch {
            showToast("Error al cambiar el rol", false);
        }
    };

    const changePlan = async (userId: string, newPlan: string) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CHANGE_PLAN", userId, plan: newPlan }),
            });
            if (!res.ok) throw new Error("Failed");
            showToast(`Suscripción cambiada a ${newPlan} correctamente`);
            fetchUsers();
        } catch {
            showToast("Error al cambiar la suscripción", false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed");
            setDeleteTarget(null);
            showToast("Usuario eliminado correctamente");
            await fetchUsers();
        } catch {
            showToast("Error al eliminar el usuario", false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Cargando base de usuarios...</div>;

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
                    transition: "all 0.3s ease"
                }}>
                    {toast.ok ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Gestión de Usuarios</h1>
                <p style={{ color: "var(--text-secondary)" }}>Controla el acceso y las suscripciones de los miembros. ({users.length} usuarios)</p>
            </header>

            {/* Search bar */}
            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo electrónico..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={inputStyle}
                    />
                    <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            <section className="glass-card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <th style={{ padding: "1.5rem 1rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "700" }}>USUARIO</th>
                            <th style={{ padding: "1.5rem 1rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "700" }}>PLAN ACTUAL</th>
                            <th style={{ padding: "1.5rem 1rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "700" }}>ROL</th>
                            <th style={{ padding: "1.5rem 1rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "700", textAlign: "right" }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "36px", height: "36px", borderRadius: "10px",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)"
                                        }}>
                                            {(user.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: "700", color: "white" }}>{user.name || "Sin nombre"}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        {user.subscription ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span className={`badge badge-${user.subscription.plan.toLowerCase()}`}>
                                                    {user.subscription.plan}
                                                </span>
                                                <span style={{ fontSize: "0.7rem", color: user.subscription.status === "ACTIVE" ? "var(--success)" : "var(--error)", fontWeight: "700", minWidth: "60px" }}>
                                                    ● {user.subscription.status}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="badge badge-free" style={{ minWidth: "123px" }}>GRATIS</span>
                                        )}
                                        <select
                                            value={user.subscription ? user.subscription.plan : "FREE"}
                                            onChange={(e) => changePlan(user.id, e.target.value)}
                                            style={{
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: "white",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                outline: "none",
                                                cursor: "pointer",
                                                fontSize: "0.75rem",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            <option value="FREE">Cambiar a Gratis</option>
                                            <option value="BASIC">Cambiar a Básico</option>
                                            <option value="STANDARD">Cambiar a Estándar</option>
                                            <option value="PREMIUM">Cambiar a Premium</option>
                                        </select>
                                    </div>
                                </td>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <span style={{
                                        backgroundColor: user.role === "ADMIN" ? "rgba(229, 9, 20, 0.1)" : "rgba(255, 255, 255, 0.05)",
                                        color: user.role === "ADMIN" ? "#e50914" : "var(--text-secondary)",
                                        padding: "4px 10px", borderRadius: "6px",
                                        fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.5px"
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: "1.2rem 1rem", textAlign: "right" }}>
                                    <button
                                        type="button"
                                        onClick={() => toggleRole(user.id, user.role)}
                                        style={{ color: "var(--text-secondary)", fontWeight: "700", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", marginRight: "15px" }}
                                    >
                                        Hacer {user.role === "ADMIN" ? "Usuario" : "Admin"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(user)}
                                        style={{ color: "#ef4444", fontWeight: "700", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={{ padding: "5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No se han encontrado usuarios que coincidan con la búsqueda.
                    </div>
                )}
            </section>

            {/* DELETE CONFIRMATION MODAL */}
            {
                deleteTarget && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
                        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "480px", textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "1rem" }}>¿Eliminar este usuario?</h2>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Vas a eliminar permanentemente:</p>
                            <p style={{ fontWeight: "800", color: "white", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                                {deleteTarget.name || "Sin nombre"}
                            </p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{deleteTarget.email}</p>
                            <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "2rem" }}>
                                Se borrarán todos sus perfiles, historial y suscripción. Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: "flex", gap: "15px" }}>
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="btn btn-primary"
                                    style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)", color: "#ef4444" }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px 12px 45px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.2s"
};
