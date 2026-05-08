"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";
import { useT } from "@/components/LangProvider";

export default function Navbar() {
    const { data: session } = useSession();
    const { t } = useT();
    const [scrolled, setScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSocial, setShowSocial] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isDark, setIsDark] = useState(true);
    const [siteName, setSiteName] = useState("Vexora");
    const [sections, setSections] = useState<Record<string, "visible" | "soon" | "hidden">>({
        movies: "visible", series: "visible", animes: "visible", list: "visible",
        calendar: "visible", requests: "visible", support: "visible", plans: "visible",
        search: "visible", social: "visible", achievements: "visible", level: "visible",
    });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
                if (d.sections) setSections(prev => ({ ...prev, ...d.sections }));
            })
            .catch(() => { });

        // Initial notification fetch + avatar GIF
        const selectedProfileId = localStorage.getItem("selectedProfileId");
        if (selectedProfileId) {
            fetch(`/api/notifications?profileId=${selectedProfileId}`)
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error fetching notifications", err));

            // Load GIF avatar from prefs cache or API
            const cached = localStorage.getItem("prefs");
            if (cached) {
                try { const p = JSON.parse(cached); if (p.avatarGifUrl) setAvatarUrl(p.avatarGifUrl); } catch {}
            }
            fetch(`/api/preferences?profileId=${selectedProfileId}`)
                .then(r => r.json())
                .then(p => { if (p?.avatarGifUrl) setAvatarUrl(p.avatarGifUrl); })
                .catch(() => {});
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

    const prontoTag = (
        <span style={{ fontSize: "0.52rem", background: "#6366f1", color: "white", padding: "1px 5px", borderRadius: "4px", fontWeight: "900", marginLeft: "5px", verticalAlign: "middle", letterSpacing: "0.5px" }}>
            PRONTO
        </span>
    );

    const navLink = (key: string, href: string, label: string) => {
        const s = sections[key];
        if (s === "hidden") return null;
        if (s === "soon") return (
            <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: "4px", opacity: 0.45, cursor: "not-allowed", fontSize: "inherit" }}>
                {label}{prontoTag}
            </span>
        );
        return (
            <Link key={key} href={href} className={pathname === href ? styles.active : ''}>
                {label}
            </Link>
        );
    };

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
                        <Link href="/" className={pathname === '/' ? styles.active : ''}>{t("nav.home")}</Link>
                        {session && (session.user as any).role === 'ADMIN' && (
                            <Link href="/admin" style={{ color: 'var(--primary)', fontWeight: '800' }}>{t("nav.admin")}</Link>
                        )}
                        {navLink("movies",   "/movies",   t("nav.movies"))}
                        {navLink("series",   "/series",   t("nav.series"))}
                        {navLink("animes",   "/animes",   t("nav.animes"))}
                        {navLink("list",     "/list",     t("nav.list"))}
                        <Link href="/discover" className={pathname === '/discover' ? styles.active : ''}>{t("nav.discover")}</Link>
                        {navLink("calendar", "/calendar", t("nav.calendar"))}
                        {navLink("requests", "/requests", t("nav.requests"))}
                        {navLink("support",  "/support",  t("nav.support"))}
                        {navLink("plans",    "/plans",    t("nav.plans"))}
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.iconSet}>
                        {sections.search !== "hidden" && (
                            sections.search === "soon"
                                ? <span className={styles.iconBtn} style={{ opacity: 0.45, cursor: "not-allowed" }}>🔍{prontoTag}</span>
                                : <Link href="/search" className={styles.iconBtn}>🔍</Link>
                        )}
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
                                    src={avatarUrl || session.user?.image || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
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
                                                src={avatarUrl || session.user?.image || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                                alt="Profile"
                                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
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
                                            {t("nav.profiles")}
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
                                            ⚙️ {t("nav.account")}
                                        </Link>
                                        {sections.list !== "hidden" && (
                                            sections.list === "soon"
                                                ? <span style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }}>🔖 {t("nav.mylist")}{prontoTag}</span>
                                                : <Link href="/list" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'white', textDecoration: 'none' }}>🔖 {t("nav.mylist")}</Link>
                                        )}
                                        {sections.achievements !== "hidden" && (
                                            sections.achievements === "soon"
                                                ? <span style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }}>🏆 {t("nav.achievements")}{prontoTag}</span>
                                                : <Link href="/achievements" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'white', textDecoration: 'none' }}>🏆 {t("nav.achievements")}</Link>
                                        )}
                                        {sections.level !== "hidden" && (
                                            sections.level === "soon"
                                                ? <span style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }}>⭐ Nivel{prontoTag}</span>
                                                : <Link href="/level" className={styles.dropdownLink} style={{ display: 'block', padding: '10px 20px', fontSize: '13px', color: 'white', textDecoration: 'none' }}>⭐ Nivel</Link>
                                        )}
                                    </div>

                                    {/* Social Section */}
                                    {sections.social !== "hidden" && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {/* Header — clickable to expand/collapse */}
                                        <button
                                            onClick={() => sections.social !== "soon" && setShowSocial(v => !v)}
                                            style={{
                                                width: '100%',
                                                padding: '11px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'none',
                                                border: 'none',
                                                cursor: sections.social === "soon" ? 'not-allowed' : 'pointer',
                                                opacity: sections.social === "soon" ? 0.45 : 1,
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '13px' }}>🌐</span>
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{t("nav.social")}</span>
                                                {sections.social === "soon" && prontoTag}
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
                                        {showSocial && sections.social !== "soon" && (
                                            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingBottom: '4px' }}>
                                                {[
                                                    { icon: '👥', label: t("nav.friends"), href: '/social/friends' },
                                                    { icon: '💬', label: t("nav.chat"),    href: '/social/chat' },
                                                    { icon: '🎉', label: t("nav.watchparty"), href: '/social/party' },
                                                ].map((item) => (
                                                    <a
                                                        key={item.label}
                                                        href={item.href}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '9px 20px 9px 36px',
                                                            textDecoration: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.15s',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <span style={{ fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>{item.icon}</span>
                                                            {item.label}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Logout Section */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
                                        <button
                                            onClick={handleLogout}
                                            style={{ width: '100%', padding: '12px 20px', fontSize: '13px', color: '#ef4444', textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                                        >
                                            {t("nav.logout")} {siteName}
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
                            {t("nav.login")}
                        </Link>
                    )}

                </div>
            </div>
        </nav>
    );
}
