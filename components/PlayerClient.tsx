"use client";

import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface VideoServer {
    id: string;
    name: string;
    url: string;
    quality: string;
}

interface PlayerClientProps {
    title: string;
    defaultUrl: string;
    servers: VideoServer[];
}

export default function PlayerClient({ title, defaultUrl, servers }: PlayerClientProps) {
    const router = useRouter();

    // The user's provided default url becomes the "Servidor Predeterminado" if servers are active
    const legacyServer: VideoServer = {
        id: "default-0",
        name: "Servidor Principal",
        url: defaultUrl,
        quality: "Auto"
    };

    const allServers = servers.length > 0 ? servers : [legacyServer];

    const [activeServer, setActiveServer] = useState<VideoServer>(allServers[0]);

    return (
        <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header / Back button */}
            <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", zIndex: 50, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
                <button
                    onClick={() => router.push("/")}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white",
                        fontWeight: "700", cursor: "pointer", fontSize: "1rem", opacity: 0.8, transition: "opacity 0.2s"
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = "1"}
                    onMouseOut={e => e.currentTarget.style.opacity = "0.8"}
                >
                    <ArrowLeft size={20} />
                    VOLVER
                </button>
            </div>

            {/* Video Player */}
            <div style={{ flex: 1, backgroundColor: "black", position: "relative" }}>
                <VideoPlayer src={activeServer.url} title={`${title} - ${activeServer.name}`} />
            </div>

            {/* Server Selection UI (Below player) */}
            <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                <h2 style={{ color: "white", fontSize: "1.2rem", fontWeight: "800", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Seleccionar Servidor
                </h2>

                <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(30,41,59,0.7)", backdropFilter: "blur(10px)" }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {allServers.map((srv, idx) => {
                            const isActive = srv.id === activeServer.id;
                            return (
                                <button
                                    key={srv.id}
                                    onClick={() => setActiveServer(srv)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        padding: "12px 20px", borderRadius: "8px",
                                        backgroundColor: isActive ? "var(--primary)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${isActive ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                        color: "white", cursor: "pointer", transition: "all 0.2s",
                                        boxShadow: isActive ? "0 4px 15px rgba(37,99,235,0.4)" : "none",
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                                        <span style={{ fontWeight: "800", fontSize: "0.95rem" }}>{srv.name}</span>
                                        <span style={{
                                            fontSize: "0.7rem", fontWeight: "900", padding: "2px 6px", borderRadius: "4px",
                                            backgroundColor: isActive ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)"
                                        }}>
                                            {srv.quality}
                                        </span>
                                    </div>
                                    {isActive && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "white", marginLeft: "5px" }} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
