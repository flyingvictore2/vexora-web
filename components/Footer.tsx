"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export default function Footer() {
    const pathname = usePathname();
    const [siteName, setSiteName] = useState("Antigra");

    useEffect(() => {
        fetch("/api/config")
            .then(r => r.json())
            .then(d => { if (d.siteName) setSiteName(d.siteName); })
            .catch(() => {});
    }, []);

    // Ocultar en auth, perfiles y admin
    if (
        pathname?.startsWith("/auth") ||
        pathname === "/profiles" ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/watch")
    ) return null;

    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            {/* Redes sociales */}
            <div className={styles.socials}>
                <a href="#" className={styles.socialIcon} aria-label="Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                </a>
                <a href="#" className={styles.socialIcon} aria-label="Instagram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                </a>
                <a href="#" className={styles.socialIcon} aria-label="Twitter / X">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                </a>
                <a href="#" className={styles.socialIcon} aria-label="YouTube">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#000"/>
                    </svg>
                </a>
            </div>

            {/* Links */}
            <div className={styles.links}>
                <Link href="/support">Audio y subtítulos</Link>
                <Link href="/support">Aviso legal</Link>
                <Link href="/support">Preferencias de cookies</Link>
                <Link href="/support">Ayuda</Link>
                <Link href="/account">Centro de privacidad</Link>
                <Link href="/support">Política de privacidad</Link>
                <Link href="/support">Información de la empresa</Link>
                <Link href="/support">Empleos</Link>
                <Link href="/support">Centro de medios</Link>
                <Link href="/account">Notificaciones</Link>
                <Link href="/plans">Planes</Link>
                <Link href="/support">Contacto</Link>
            </div>

            {/* Logo y copyright */}
            <div className={styles.bottom}>
                <span className={styles.logo}>{siteName.toUpperCase()}</span>
                <span className={styles.copy}>© {currentYear} {siteName}. Todos los derechos reservados.</span>
            </div>
        </footer>
    );
}
