"use client";

import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';

export function AccesoAnticipadoWidget() {
    return (
        <div className={styles.widget} style={{ border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, transparent 100%)' }}>
            <h3 className={styles.widgetTitle} style={{ color: '#2563eb' }}>Acceso anticipado</h3>
            <p className={styles.widgetText} style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                Estamos en fase de pruebas. Para cualquier error mandar un mensaje a
                <Link href="/support" style={{ color: '#2563eb', fontWeight: '800', marginLeft: '5px', textDecoration: 'none' }}>
                    SOPORTE
                </Link>.
            </p>
        </div>
    );
}

export function ReferralWidget() {
    return (
        <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Invitar amigos</h3>
            <p className={styles.widgetText}>Por cada amigo que se registre ganas 5 puntos.</p>
            <input type="email" placeholder="amigo@email.com" className={styles.input} />
            <button className="btn btn-primary" style={{ width: '100%' }}>ENVIAR INVITACIÓN</button>
            <p className={styles.footerText}>Tienes 25 invitaciones todavía.</p>
        </div>
    );
}

export function CalendarWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [releases, setReleases] = useState<any[]>([]);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const res = await axios.get(`/api/calendar?month=${month}&year=${year}`);
                setReleases(res.data);
            } catch (error) {
                console.error("Error fetching calendar releases", error);
            }
        };
        fetchReleases();
    }, [month, year]);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    const hasRelease = (day: number) => {
        return releases.some(r => {
            const d = new Date(r.releaseDate);
            return d.getUTCDate() === day && d.getUTCMonth() === month && d.getUTCFullYear() === year;
        });
    };

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const prevMonthDays = Array.from({ length: startOffset }, (_, i) => {
        const lastDayPrevMonth = new Date(year, month, 0).getDate();
        return lastDayPrevMonth - startOffset + i + 1;
    });

    return (
        <div className={styles.widget}>
            <div className={styles.calendarHeader}>
                <span onClick={goToPrevMonth} style={{ cursor: 'pointer', padding: '0 8px', fontWeight: 'bold', opacity: 0.8 }}>‹</span>
                <strong>{capitalizedMonth}, {year}</strong>
                <span onClick={goToNextMonth} style={{ cursor: 'pointer', padding: '0 8px', fontWeight: 'bold', opacity: 0.8 }}>›</span>
            </div>
            <div className={styles.calendarGrid}>
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                    <span key={d} className={styles.dayHead}>{d}</span>
                ))}
                {prevMonthDays.map(d => (
                    <span key={`prev-${d}`} className={styles.dayOff}>{d}</span>
                ))}
                {days.map(d => (
                    <span
                        key={d}
                        className={[
                            styles.day,
                            isToday(d) ? styles.today : '',
                            hasRelease(d) ? styles.hasRelease : '',
                        ].join(' ').trim()}
                    >
                        {d}
                    </span>
                ))}
            </div>
            {releases.length > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {releases.slice(0, 3).map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--primary)' }}>●</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                        </div>
                    ))}
                    {releases.length > 3 && <span>+ {releases.length - 3} más...</span>}
                </div>
            )}
            <Link href="/calendar" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                VER PROGRAMACIÓN
            </Link>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    if (pathname?.startsWith('/auth') || pathname === '/profiles') {
        return null;
    }

    return (
        <aside className={styles.sidebar}>
            <AccesoAnticipadoWidget />
            <ReferralWidget />
            <CalendarWidget />
        </aside>
    );
}
