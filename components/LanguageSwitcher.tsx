"use client";

import React, { useState, useEffect } from "react";

export default function LanguageSwitcher() {
    const [lang, setLang] = useState("EN");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleLang = () => {
        setLang(prev => prev === "EN" ? "ES" : "EN");
        alert(`Language switched to ${lang === "EN" ? "Spanish" : "English"}`);
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggleLang}
            style={{
                color: "white",
                fontSize: "0.9rem",
                border: "1px solid white",
                padding: "5px 10px",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.5)"
            }}
        >
            🌐 {lang}
        </button>
    );
}
