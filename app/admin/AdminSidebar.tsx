"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
    { name: "Resumen", href: "/admin", icon: "📊" },
    { name: "Películas & Series", href: "/admin/movies", icon: "🎬" },
    { name: "Listas públicas", href: "/admin/lists", icon: "📋" },
    { name: "Servidores", href: "/admin/servers", icon: "🌐" },
    { name: "Secciones visibles", href: "/admin/sections", icon: "👁️" },
    { name: "Soporte", href: "/admin/support", icon: "📬" },
    { name: "Solicitudes", href: "/admin/requests", icon: "✍️" },
    { name: "Usuarios", href: "/admin/users", icon: "👤" },
    { name: "Ajustes", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
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
                                textDecoration: "none",
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
    );
}
