"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InvoiceDownloader from "@/components/InvoiceDownloader";

type Tab = "perfil" | "seguridad" | "suscripcion" | "facturacion";

const PRIMARY = "var(--primary)";

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {children}
        </h2>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    transition: "border-color 0.2s",
};

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
    return (
        <div style={{
            padding: "12px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            background: type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: type === "success" ? "#34d399" : "#f87171",
            border: `1px solid ${type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
            {msg}
        </div>
    );
}

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("perfil");
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Perfil
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Contraseña
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/login");
    }, [status, router]);

    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/account/profile")
            .then(r => r.json())
            .then(d => {
                setUserData(d);
                setName(d.name || "");
                setEmail(d.email || "");
            })
            .finally(() => setLoading(false));
    }, [status]);

    if (status === "loading" || loading) {
        return (
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
            </div>
        );
    }

    // ── Guardar perfil ──────────────────────────────────────────────
    const saveProfile = async () => {
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            const res = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar");
            setProfileMsg({ type: "success", text: "¡Perfil actualizado correctamente!" });
            setUserData((prev: any) => ({ ...prev, name: data.name, email: data.email }));
        } catch (e: any) {
            setProfileMsg({ type: "error", text: e.message });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Cambiar contraseña ──────────────────────────────────────────
    const changePassword = async () => {
        if (newPwd !== confirmPwd) {
            setPwdMsg({ type: "error", text: "Las contraseñas nuevas no coinciden" });
            return;
        }
        if (newPwd.length < 6) {
            setPwdMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
            return;
        }
        setPwdLoading(true);
        setPwdMsg(null);
        try {
            const res = await fetch("/api/account/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña");
            setPwdMsg({ type: "success", text: "¡Contraseña actualizada correctamente!" });
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch (e: any) {
            setPwdMsg({ type: "error", text: e.message });
        } finally {
            setPwdLoading(false);
        }
    };

    const planColor: Record<string, string> = {
        ORO: "#fbbf24", PLATA: "#94a3b8", BRONCE: "#cd7f32", GRATIS: "#475569", FREE: "#475569",
    };
    const currentPlan = userData?.subscription?.plan || "GRATIS";
    const nextBilling = userData?.subscription?.nextBillingDate
        ? new Date(userData.subscription.nextBillingDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
        : null;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "perfil", label: "Perfil", icon: "👤" },
        { id: "seguridad", label: "Seguridad", icon: "🔒" },
        { id: "suscripcion", label: "Suscripción", icon: "⭐" },
        { id: "facturacion", label: "Facturación", icon: "🧾" },
    ];

    return (
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px 60px" }}>

            {/* Header */}
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "6px" }}>Configuración de cuenta</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Gestiona tu información, seguridad y suscripción.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "2rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "7px",
                            border: "none",
                            fontFamily: "inherit",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: tab === t.id ? PRIMARY : "transparent",
                            color: tab === t.id ? "white" : "var(--text-secondary)",
                        }}
                    >
                        <span style={{ fontSize: "14px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: PERFIL ──────────────────────────────────────────── */}
            {tab === "perfil" && (
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <SectionTitle>Información personal</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
                        {profileMsg && <Alert type={profileMsg.type} msg={profileMsg.text} />}

                        <Field label="Nombre">
                            <input
                                style={inputStyle}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Tu nombre"
                                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </Field>

                        <Field label="Email">
                            <input
                                style={inputStyle}
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </Field>

                        <Field label="Rol">
                            <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "var(--text-secondary)" }}>
                                {(session?.user as any)?.role === "ADMIN" ? "🛡️ Administrador" : "👤 Usuario"}
                            </div>
                        </Field>

                        <Field label="Miembro desde">
                            <div style={{ padding: "11px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "14px", color: "var(--text-secondary)" }}>
                                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                            </div>
                        </Field>

                        <button
                            className="btn btn-primary"
                            onClick={saveProfile}
                            disabled={profileLoading}
                            style={{ alignSelf: "flex-start", opacity: profileLoading ? 0.7 : 1 }}
                        >
                            {profileLoading ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                    {/* Gestionar perfiles */}
                    <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Perfiles de usuario</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                            Gestiona los perfiles asociados a tu cuenta.
                        </p>
                        <Link href="/profiles" className="btn btn-secondary" style={{ fontSize: "13px", padding: "8px 18px" }}>
                            Gestionar perfiles
                        </Link>
                    </div>
                </div>
            )}

            {/* ─── TAB: SEGURIDAD ───────────────────────────────────────── */}
            {tab === "seguridad" && (
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <SectionTitle>Cambiar contraseña</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "480px" }}>
                        {pwdMsg && <Alert type={pwdMsg.type} msg={pwdMsg.text} />}

                        {userData?.password !== undefined && (
                            <Field label="Contraseña actual">
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPwd ? "text" : "password"}
                                        style={{ ...inputStyle, paddingRight: "42px" }}
                                        value={currentPwd}
                                        onChange={e => setCurrentPwd(e.target.value)}
                                        placeholder="••••••••"
                                        onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                                    />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "15px" }}>
                                        {showPwd ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </Field>
                        )}

                        <Field label="Nueva contraseña">
                            <input
                                type={showPwd ? "text" : "password"}
                                style={inputStyle}
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </Field>

                        <Field label="Confirmar nueva contraseña">
                            <input
                                type={showPwd ? "text" : "password"}
                                style={{
                                    ...inputStyle,
                                    borderColor: confirmPwd && confirmPwd !== newPwd ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
                                }}
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                                placeholder="••••••••"
                                onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
                                onBlur={e => (e.currentTarget.style.borderColor = confirmPwd && confirmPwd !== newPwd ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)")}
                            />
                        </Field>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button
                                className="btn btn-primary"
                                onClick={changePassword}
                                disabled={pwdLoading}
                                style={{ opacity: pwdLoading ? 0.7 : 1 }}
                            >
                                {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
                            </button>
                            <Link href="/auth/forgot-password" style={{ fontSize: "13px", color: PRIMARY }}>
                                ¿Olvidaste la actual?
                            </Link>
                        </div>
                    </div>

                    {/* Cerrar sesión */}
                    <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Sesión</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                            Cierra sesión en todos los dispositivos.
                        </p>
                        <button
                            onClick={() => { localStorage.removeItem("selectedProfileId"); signOut({ callbackUrl: "/auth/login" }); }}
                            className="btn btn-secondary"
                            style={{ fontSize: "13px", padding: "8px 18px" }}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}

            {/* ─── TAB: SUSCRIPCIÓN ─────────────────────────────────────── */}
            {tab === "suscripcion" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Plan actual */}
                    <div className="glass-card" style={{ padding: "2rem" }}>
                        <SectionTitle>Plan actual</SectionTitle>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>{currentPlan}</span>
                            <span style={{
                                padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                                background: userData?.subscription ? "rgba(16,185,129,0.15)" : "rgba(71,85,105,0.3)",
                                color: userData?.subscription ? "#34d399" : "#94a3b8",
                                border: `1px solid ${userData?.subscription ? "rgba(16,185,129,0.25)" : "rgba(71,85,105,0.3)"}`,
                            }}>
                                {userData?.subscription ? "Activo" : "Gratis"}
                            </span>
                        </div>

                        {nextBilling && (
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                                Próximo cobro: <strong style={{ color: "white" }}>{nextBilling}</strong>
                            </p>
                        )}

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <Link href="/plans" className="btn btn-primary" style={{ fontSize: "13px" }}>
                                {userData?.subscription ? "Cambiar plan" : "Mejorar a Premium"}
                            </Link>
                            {userData?.subscription && (
                                <button className="btn btn-secondary" style={{ fontSize: "13px", color: "#f87171" }}
                                    onClick={async () => {
                                        if (!confirm("¿Seguro que quieres cancelar tu suscripción?")) return;
                                        await fetch("/api/subscribe", { method: "DELETE" });
                                        window.location.reload();
                                    }}>
                                    Cancelar suscripción
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Comparativa de planes */}
                    <div className="glass-card" style={{ padding: "2rem" }}>
                        <SectionTitle>Qué incluye cada plan</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                            {[
                                { name: "GRATIS", color: "#475569", features: ["Catálogo básico", "720p", "1 perfil"] },
                                { name: "BRONCE", color: "#cd7f32", features: ["Catálogo completo", "1080p", "2 perfiles", "Sin anuncios"] },
                                { name: "PLATA", color: "#94a3b8", features: ["Todo de Bronce", "4K", "3 perfiles", "Descargas"] },
                                { name: "ORO", color: "#fbbf24", features: ["Todo de Plata", "4K HDR", "5 perfiles", "Acceso anticipado"] },
                            ].map(p => (
                                <div key={p.name} style={{
                                    padding: "1rem", borderRadius: "10px",
                                    border: `1px solid ${currentPlan === p.name ? p.color : "rgba(255,255,255,0.06)"}`,
                                    background: currentPlan === p.name ? `${p.color}15` : "rgba(255,255,255,0.02)",
                                }}>
                                    <div style={{ fontWeight: 800, color: p.color, marginBottom: "0.75rem", fontSize: "14px" }}>
                                        {p.name} {currentPlan === p.name && "✓"}
                                    </div>
                                    {p.features.map(f => (
                                        <div key={f} style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                            · {f}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: FACTURACIÓN ─────────────────────────────────────── */}
            {tab === "facturacion" && (
                <div className="glass-card" style={{ padding: "2rem", overflowX: "auto" }}>
                    <SectionTitle>Historial de pagos</SectionTitle>
                    {userData?.invoices?.length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    {["Fecha", "Plan", "Estado", "Total", "Factura"].map(h => (
                                        <th key={h} style={{ padding: "10px 12px", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700, textAlign: h === "Factura" ? "right" : "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {userData.invoices.map((inv: any) => (
                                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        <td style={{ padding: "14px 12px", fontSize: "13px" }}>
                                            {new Date(inv.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: "13px" }}>{inv.plan}</td>
                                        <td style={{ padding: "14px 12px" }}>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700,
                                                background: inv.status === "PAID" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                                color: inv.status === "PAID" ? "#34d399" : "#f87171",
                                            }}>
                                                {inv.status === "PAID" ? "Pagado" : inv.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 12px", fontWeight: 700, fontSize: "13px" }}>
                                            {new Intl.NumberFormat("es-ES", { style: "currency", currency: inv.currency || "EUR" }).format(inv.amount)}
                                        </td>
                                        <td style={{ padding: "14px 12px", textAlign: "right" }}>
                                            <InvoiceDownloader invoice={{
                                                id: inv.id,
                                                date: new Date(inv.date).toLocaleDateString("es-ES"),
                                                amount: new Intl.NumberFormat("es-ES", { style: "currency", currency: inv.currency || "EUR" }).format(inv.amount),
                                                plan: inv.plan,
                                                status: inv.status,
                                            }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧾</div>
                            <p style={{ marginBottom: "1rem" }}>No tienes facturas todavía.</p>
                            <Link href="/plans" className="btn btn-primary" style={{ fontSize: "13px" }}>
                                Ver planes
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
