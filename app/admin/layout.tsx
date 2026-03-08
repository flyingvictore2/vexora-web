"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated" || (status === "authenticated" && (session?.user as any).role !== "ADMIN")) {
            router.push("/");
        }
    }, [status, session, router]);

    if (status === "loading" || (status === "authenticated" && (session?.user as any).role !== "ADMIN")) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#0b0c10", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ color: "var(--error)", fontSize: "2rem", fontWeight: "900", marginBottom: "1rem" }}>ACCESO DENEGADO</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Necesitas permisos de administrador para entrar aquí.</p>
                </div>
            </div>
        );
    }

    const navItems = [
        { name: "Resumen", href: "/admin", icon: "📊" },
        { name: "Películas & Series", href: "/admin/movies", icon: "🎬" },
        { name: "Servidores", href: "/admin/servers", icon: "🌐" },
        { name: "Soporte", href: "/admin/support", icon: "📬" },
        { name: "Solicitudes", href: "/admin/requests", icon: "✍️" },
        { name: "Usuarios", href: "/admin/users", icon: "👤" },
        { name: "Ajustes", href: "/admin/settings", icon: "⚙️" },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0b0c10" }}>
            {/* Sidebar */}
            <aside style={{
                width: "280px",
                backgroundColor: "rgba(17, 24, 39, 0.4)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(255, 255, 255, 0.05)",
                padding: "40px 20px",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                height: "100vh",
                left: 0,
                top: 0,
                zIndex: 50
            }}>
                <div style={{ paddingLeft: "15px", marginBottom: "3rem" }}>
                    <Link href="/" style={{ color: "white", fontSize: "1.4rem", fontWeight: "900", textDecoration: "none" }}>
                        <span style={{ color: "var(--primary)" }}>●</span> ADMIN<span style={{ fontWeight: "400", opacity: 0.6 }}>PRO</span>
                    </Link>
                </div>

                <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "14px 20px",
                                    borderRadius: "12px",
                                    backgroundColor: isActive ? "rgba(37, 99, 235, 0.1)" : "transparent",
                                    color: isActive ? "white" : "var(--text-secondary)",
                                    fontWeight: isActive ? "700" : "500",
                                    fontSize: "0.9rem",
                                    transition: "all 0.2s ease",
                                    border: isActive ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent",
                                }}
                            >
                                <span style={{ fontSize: "1.2rem", filter: isActive ? "none" : "grayscale(100%) opacity(0.5)" }}>{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🏠</span> Volver a la web
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: "280px",
                padding: "60px 50px",
                backgroundColor: "#0b0c10",
                minHeight: "100vh"
            }}>
                {children}
            </main>
        </div>
    );
}
