"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const { data: session } = useSession();
    const [scrolled, setScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSocial, setShowSocial] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isDark, setIsDark] = useState(true);
    const [siteName, setSiteName] = useState("Vexora");
    const [sections, setSections] = useState({
        movies: true, series: true, animes: true, list: true,
        calendar: true, requests: true, support: true, plans: true, search: true,
    });
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Theme initialization
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light") {
            setIsDark(false);
            document.body.classList.add("light-theme");
        }

        fetch("/api/config")
            .then(r => r.json())
            .then(d => {
                if (d.siteName) setSiteName(d.siteName);
                if (d.sections) setSections(s => ({ ...s, ...d.sections }));
            })
            .catch(() => { });

        // Initial notification fetch
        const selectedProfileId = localStorage.getItem("selectedProfileId");
        if (selectedProfileId) {
            fetch(`/api/notifications?profileId=${selectedProfileId}`)
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error fetching notifications", err));
        }

        // Poll for notifications every 2 minutes
        const interval = setInterval(() => {
            const profileId = localStorage.getItem("selectedProfileId");
            if (profileId) {
                fetch(`/api/notifications?profileId=${profileId}`)
                    .then(res => res.json())
                    .then(data => setNotifications(Array.isArray(data) ? data : []))
                    .catch(() => { });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.body.classList.remove("light-theme");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.add("light-theme");
            localStorage.setItem("theme", "light");
        }
    };

    const toggleNotifications = () => {
        const newShow = !showNotifications;
        setShowNotifications(newShow);
        if (showDropdown) setShowDropdown(false);

        // Mark as read when opening
        if (newShow && notifications.some(n => !n.isRead)) {
            const profileId = localStorage.getItem("selectedProfileId");
            if (profileId) {
                fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profileId })
                }).then(() => {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }).catch(() => { });
            }
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Hide navbar on auth and profiles pages
    if (pathname?.startsWith('/auth') || pathname === '/profiles') {
        return null;
    }

    const handleLogout = async () => {
        localStorage.removeItem("selectedProfileId");
        await signOut({ callbackUrl: "/auth/login" });
    };

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <Link href="/" className={styles.logo}>
                        <span style={{ color: '#2563eb' }}>●</span> {siteName}
                    </Link>
                    <div className={styles.links}>
                        <Link href="/" className={pathname === '/' ? styles.active : ''}>INICIO</Link>
                        {session && (session.user as any).role === 'ADMIN' && (
                            <Link href="/admin" style={{ color: 'var(--primary)', fontWeight: '800' }}>PANEL ADMIN</Link>
                        )}
                        {sections.movies   && <Link href="/movies"   className={pathname === '/movies'   ? styles.active : ''}>PELÍCULAS</Link>}
                        {sections.series   && <Link href="/series"   className={pathname === '/series'   ? styles.active : ''}>SERIES</Link>}
                        {sections.animes   && <Link href="/animes"   className={pathname === '/animes'   ? styles.active : ''}>ANIMES</Link>}
                        {sections.list     && <Link href="/list"     className={pathname === '/list'     ? styles.active : ''}>LISTAS</Link>}
                        {sections.calendar && <Link href="/calendar" className={pathname === '/calendar' ? styles.active : ''}>CALENDARIO</Link>}
                        {sections.requests && <Link href="/requests" className={pathname === '/requests' ? styles.active : ''}>SOLICITUDES</Link>}
                        {sections.support  && <Link href="/support"  className={pathname === '/support'  ? styles.active : ''}>SOPORTE</Link>}
                        {sections.plans    && <Link href="/plans"    className={pathname === '/plans'    ? styles.active : ''}>PLANES</Link>}
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.iconSet}>
                        {sections.search && <Link href="/search" className={styles.iconBtn}>🔍</Link>}
                        <button className={styles.iconBtn} onClick={toggleTheme}>
                            {isDark ? "🌙" : "☀️"}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button className={styles.iconBtn} onClick={toggleNotifications} style={{ position: 'relative' }}>
                                🔔
                                {notifications.some(n => !n.isRead) && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: '#ef4444',
                                        borderRadius: '50%',
                                        border: '2px solid #111827'
                                    }} />
                                )}
                            </button>
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 15px)',
                                    right: 0,
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    width: '320px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    padding: '20px',
                                    zIndex: 1000,
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                    animation: 'dropdownIn 0.2s ease-out'
                                }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '15px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                                        NOTIFICACIONES
                                        {notifications.length > 0 && <span style={{ fontSize: '10px', opacity: 0.5 }}>{notifications.length} recientas</span>}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.6 }}>
                                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
                                                <p style={{ fontSize: '12px', color: 'white' }}>No tienes notificaciones pendientes</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => n.movieId && router.push(`/title/${n.movieId}`)}
                                                    style={{
                                                        padding: '12px',
                                                        backgroundColor: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(37, 99, 235, 0.1)',
                                                        borderRadius: '8px',
                                                        cursor: n.movieId ? 'pointer' : 'default',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => n.movieId && (e.currentTarget.style.transform = 'scale(1.02)')}
                                                    onMouseLeave={(e) => n.movieId && (e.currentTarget.style.transform = 'scale(1)')}
                                                >
                                                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{n.title}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>{n.message}</div>
                                                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        style={{ width: '100%', marginTop: '15px', padding: '10px', fontSize: '11px', color: 'var(--primary)', fontWeight: '700', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer' }}
                                    >
                                        CERRAR
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {session ? (
                        <div style={{ position: 'relative' }}>
                            <div
                                className={styles.profile}
                                onClick={() => {
                                    setShowDropdown(!showDropdown);
                                    if (showNotifications) setShowNotifications(false);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {session.user && (session.user as any).subscription && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '-5px',
                                        right: '-5px',
                                        backgroundColor: (session.user as any).subscription.plan === 'ORO' ? '#fbbf24' :
                                            (session.user as any).subscription.plan === 'PLATA' ? '#c0c0c0' :
                                                (session.user as any).subscription.plan === 'BRONCE' ? '#cd7f32' : '#94a3b8',
                                        color: 'black',
                                        fontSize: '8px',
                                        fontWeight: '900',
                                        padding: '2px 5px',
                                        borderRadius: '4px',
                                        border: '1px solid #111827',
                                        zIndex: 10
                                    }}>
                                        {(session.user as any).subscription.plan}
                                    </span>
                                )}
                                <img
                                    src={session.user?.image || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                    alt="Profile"
                                    className={styles.avatar}
                                />
                            </div>

                            {showDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 15px)',
                                    right: 0,
                                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    width: '260px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    zIndex: 1000,
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                    overflow: 'hidden',
                                    animation: 'dropdownIn 0.2s ease-out'
                                }}>
                                    {/* User Info Section */}
                                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <img
                                                src={session.user?.image || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                                alt="Profile"
                                                style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {session.user?.name || session.user?.email?.split('@')[0]}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    Role: <span style={{ color: (session.user as any).role === 'ADMIN' ? 'var(--primary)' : 'white', fontWeight: '800' }}>{(session.user as any).role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href="/profiles" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                                            Administrar perfiles
                                        </Link>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: '8px 0' }}>
                                        {(session.user as any).role === 'ADMIN' && (
                                            <Link href="/admin" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '800' }}>
                                                🛡️ Panel de Administración
                                            </Link>
                                        )}
                                        <Link href="/account" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'white', textDecoration: 'none' }}>
                                            ⚙️ Configuración de cuenta
                                        </Link>
                                        <Link href="/list" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'white', textDecoration: 'none' }}>
                                            🔖 Mi lista
                                        </Link>
                                    </div>

                                    {/* Social Section */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {/* Header — clickable to expand/collapse */}
                                        <button
                                            onClick={() => setShowSocial(v => !v)}
                                            style={{
                                                width: '100%',
                                                padding: '11px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '13px' }}>🌐</span>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Social</span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: '800',
                                                    letterSpacing: '0.6px',
                                                    textTransform: 'uppercase',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(124,58,237,0.25))',
                                                    border: '1px solid rgba(99,102,241,0.3)',
                                                    color: '#a5b4fc',
                                                }}>
                                                    Próximamente
                                                </span>
                                            </span>
                                            <span style={{
                                                fontSize: '10px',
                                                color: 'rgba(255,255,255,0.3)',
                                                transition: 'transform 0.2s',
                                                display: 'inline-block',
                                                transform: showSocial ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }}>▼</span>
                                        </button>

                                        {/* Submenu items */}
                                        {showSocial && (
                                            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingBottom: '4px' }}>
                                                {[
                                                    { icon: '👥', label: 'Amigos' },
                                                    { icon: '💬', label: 'Chat' },
                                                    { icon: '🎉', label: 'Watch Party' },
                                                ].map(item => (
                                                    <div
                                                        key={item.label}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '9px 20px 9px 36px',
                                                            opacity: 0.45,
                                                            cursor: 'not-allowed',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>{item.icon}</span>
                                                            {item.label}
                                                        </span>
                                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>PRONTO</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Logout Section */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
                                        <button
                                            onClick={handleLogout}
                                            style={{ width: '100%', padding: '12px 20px', fontSize: '13px', color: '#ef4444', textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                                        >
                                            Cerrar sesión de {siteName}
                                        </button>
                                    </div>

                                    <style jsx>{`
                                        @keyframes dropdownIn {
                                            from { opacity: 0; transform: translateY(-10px); }
                                            to { opacity: 1; transform: translateY(0); }
                                        }
                                    `}</style>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', fontWeight: '700', borderRadius: '6px' }}>
                            INICIAR SESIÓN
                        </Link>
                    )}

                </div>
            </div>
        </nav>
    );
}
