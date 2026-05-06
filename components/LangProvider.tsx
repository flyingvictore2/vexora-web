"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getT, Lang } from "@/lib/i18n";

type TFunc = (key: string, fallback?: string) => string;

const LangCtx = createContext<{ t: TFunc; lang: Lang; setLang: (l: Lang) => void }>({
    t: (k) => k,
    lang: "es",
    setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("es");

    useEffect(() => {
        // Try localStorage prefs first (instant), then API
        const cached = localStorage.getItem("prefs");
        if (cached) {
            try {
                const p = JSON.parse(cached);
                if (p?.language) { setLangState(p.language as Lang); return; }
            } catch {}
        }
        const profileId = localStorage.getItem("selectedProfileId");
        if (profileId) {
            fetch(`/api/preferences?profileId=${profileId}`)
                .then(r => r.json())
                .then(p => { if (p?.language) setLangState(p.language as Lang); })
                .catch(() => {});
        }
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        // Update cache
        const cached = localStorage.getItem("prefs");
        if (cached) {
            try { localStorage.setItem("prefs", JSON.stringify({ ...JSON.parse(cached), language: l })); } catch {}
        }
    };

    return (
        <LangCtx.Provider value={{ t: getT(lang), lang, setLang }}>
            {children}
        </LangCtx.Provider>
    );
}

export function useT() {
    return useContext(LangCtx);
}
