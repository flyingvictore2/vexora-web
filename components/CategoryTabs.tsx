"use client";

import React from 'react';
import styles from './CategoryTabs.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const categories = [
    { id: 'todo', label: 'TODO', href: '/' },
    { id: 'peliculas', label: 'PELÍCULAS', href: '/movies' },
    { id: 'series', label: 'SERIES', href: '/series' },
    { id: 'animes', label: 'ANIMES', href: '/animes' },
    { id: 'listas', label: 'LISTAS', href: '/list' },
];

export default function CategoryTabs() {
    const pathname = usePathname();

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={cat.href}
                        className={`${styles.tab} ${pathname === cat.href ? styles.active : ''}`}
                    >
                        {cat.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
