"use client";

import React, { useEffect } from "react";

const THEMES: Record<string, { primary: string; primaryDark: string; glow: string }> = {
    indigo: { primary: "#6366f1", primaryDark: "#4f46e5", glow: "rgba(99,102,241,0.35)" },
    red:    { primary: "#e50914", primaryDark: "#b00610", glow: "rgba(229,9,20,0.35)" },
    purple: { primary: "#8b5cf6", primaryDark: "#7c3aed", glow: "rgba(139,92,246,0.35)" },
    blue:   { primary: "#2563eb", primaryDark: "#1d4ed8", glow: "rgba(37,99,235,0.35)" },
    green:  { primary: "#10b981", primaryDark: "#059669", glow: "rgba(16,185,129,0.35)" },
    pink:   { primary: "#ec4899", primaryDark: "#db2777", glow: "rgba(236,72,153,0.35)" },
    orange: { primary: "#f97316", primaryDark: "#ea580c", glow: "rgba(249,115,22,0.35)" },
};

const DALTONISM_FILTERS: Record<string, string> = {
    none:   "none",
    protan: "url(#protanopia)",   // svg filter, fallback below
    deutan: "url(#deuteranopia)",
    tritan: "url(#tritanopia)",
};

export default function PreferencesProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const apply = async () => {
            const profileId = localStorage.getItem("selectedProfileId");
            if (!profileId) return;

            // Local cache first (fast paint)
            const cached = localStorage.getItem("prefs");
            if (cached) applyCss(JSON.parse(cached));

            try {
                const r = await fetch(`/api/preferences?profileId=${profileId}`);
                const data = await r.json();
                localStorage.setItem("prefs", JSON.stringify(data));
                applyCss(data);
            } catch {}
        };
        apply();
    }, []);

    return <>{children}</>;
}

function applyCss(p: any) {
    const root = document.documentElement;
    const theme = THEMES[p?.themeColor || "indigo"] || THEMES.indigo;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-dark", theme.primaryDark);
    root.style.setProperty("--primary-glow", theme.glow);

    if (p?.backgroundUrl) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url("${p.backgroundUrl}")`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    } else {
        document.body.style.backgroundImage = "";
    }

    if (p?.reducedMotion) {
        root.classList.add("reduced-motion");
    } else {
        root.classList.remove("reduced-motion");
    }

    if (p?.daltonismMode && p.daltonismMode !== "none") {
        root.style.filter = DALTONISM_FILTERS[p.daltonismMode] ?? "none";
    } else {
        root.style.filter = "";
    }
}
