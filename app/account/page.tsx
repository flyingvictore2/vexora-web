import React from "react";
import InvoiceDownloader from "@/components/InvoiceDownloader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AccountPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/api/auth/signin?callbackUrl=/account");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            invoice: {
                orderBy: { date: 'desc' }
            },
            subscription: true
        }
    });

    if (!user) {
        redirect("/api/auth/signin");
    }

    const billingHistory = user.invoice.map(inv => ({
        id: inv.id,
        date: inv.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: new Intl.NumberFormat('es-ES', { style: 'currency', currency: inv.currency }).format(inv.amount),
        plan: inv.plan,
        status: inv.status
    }));

    const currentPlan = user.subscription?.plan || "GRATIS";
    const nextBilling = user.subscription?.nextBillingDate
        ? user.subscription.nextBillingDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
        : "N/A";

    const planColorClass = `badge-${currentPlan.toLowerCase()}`;

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "120px 20px 60px" }}>
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1px", marginBottom: "0.5rem" }}>Mi Cuenta</h1>
                <p style={{ color: "var(--text-secondary)" }}>Gestiona tu suscripción, facturación y detalles de seguridad.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
                {/* Membership Card */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <h2 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.5rem", fontWeight: "700" }}>Membresía</h2>
                    <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.25rem" }}>{user.email}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Contraseña: ••••••••••••</div>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button style={{ color: "var(--primary)", fontWeight: "700", fontSize: "0.9rem" }}>Editar email</button>
                        <button style={{ color: "var(--primary)", fontWeight: "700", fontSize: "0.9rem" }}>Cambiar contraseña</button>
                    </div>
                </div>

                {/* Plan Card */}
                <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <h2 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.5rem", fontWeight: "700" }}>Detalles del Plan</h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{currentPlan}</span>
                            <span className={`badge ${planColorClass}`}>{user.subscription ? 'ACTIVO' : 'FREE'}</span>
                        </div>
                        {user.subscription && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                Próximo cobro: <span style={{ color: "white", fontWeight: "600" }}>{nextBilling}</span>
                            </p>
                        )}
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem", fontSize: "0.8rem" }}>
                        {user.subscription ? 'CAMBIAR PLAN' : 'MEJORAR PLAN'}
                    </button>
                </div>
            </div>

            {/* Billing History */}
            <section className="glass-card" style={{ padding: "2rem", overflowX: "auto" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "1.5rem" }}>Historial de Facturación</h2>
                {billingHistory.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>FECHA</th>
                                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>PLAN</th>
                                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>ESTADO</th>
                                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>TOTAL</th>
                                <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textAlign: "right" }}>DOCUMENTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingHistory.map((invoice) => (
                                <tr key={invoice.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}>
                                    <td style={{ padding: "16px 12px", fontSize: "0.9rem" }}>{invoice.date}</td>
                                    <td style={{ padding: "16px 12px", fontWeight: "600" }}>{invoice.plan}</td>
                                    <td style={{ padding: "16px 12px" }}>
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            fontSize: "0.7rem",
                                            backgroundColor: invoice.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: invoice.status === 'PAID' ? 'var(--success)' : 'var(--error)',
                                            fontWeight: "700"
                                        }}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 12px", fontWeight: "700" }}>{invoice.amount}</td>
                                    <td style={{ padding: "16px 12px", textAlign: "right" }}>
                                        <InvoiceDownloader invoice={invoice} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        <p>No tienes facturas registradas todavía.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
