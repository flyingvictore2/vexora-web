"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function PartyRoomPage() {
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [partyData, setPartyData] = useState<any>(null);
    const [error, setError] = useState<string|null>(null);
    const [profileId, setProfileId] = useState<string|null>(null);
    const [chatMsg, setChatMsg] = useState("");
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pollRef = useRef<any>(null);
    const isHost = partyData?.party?.hostProfileId === profileId;
    const chatEnd = useRef<HTMLDivElement>(null);

    useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status]);
    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        setProfileId(pid);
    }, []);

    useEffect(() => {
        if (!profileId) return;
        fetchParty();
        pollRef.current = setInterval(poll, 2000);
        return () => clearInterval(pollRef.current);
    }, [profileId]);

    useEffect(() => {
        chatEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [partyData?.messages?.length]);

    const fetchParty = async () => {
        const res = await fetch(`/api/social/party?code=${code}`);
        if (!res.ok) { setError("Sala no encontrada"); return; }
        const data = await res.json();
        setPartyData(data);
    };

    const poll = async () => {
        if (!profileId) return;
        // Send heartbeat (and sync state if host)
        await fetch("/api/social/party", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, profileId }),
        });
        // Refresh party state
        const res = await fetch(`/api/social/party?code=${code}`);
        if (res.ok) setPartyData(await res.json());
    };

    const sendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMsg.trim() || !profileId) return;
        const msg = chatMsg.trim();
        setChatMsg("");
        await fetch("/api/social/party", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, profileId, message: msg }),
        });
        fetchParty();
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
            <div style={{ fontSize: "3rem" }}>😕</div>
            <h2 style={{ fontWeight: "900" }}>{error}</h2>
            <button onClick={() => router.push("/social/party")} style={{ padding: "10px 22px", background: "#6366f1", border: "none", borderRadius: "8px", color: "white", fontWeight: "800", cursor: "pointer" }}>
                Volver
            </button>
        </div>
    );

    if (!partyData) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "rgba(255,255,255,0.4)" }}>
            Cargando sala...
        </div>
    );

    const { party, members, messages } = partyData;
    const videoUrl = party.episodeVideoUrl || party.movieVideoUrl || "";
    const videoTitle = party.episodeTitle || party.movieTitle || "Sin título";
    const isEmbed = !videoUrl.endsWith(".mp4") && !videoUrl.endsWith(".m3u8");

    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: 0 }}>
            {/* Video area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000", position: "relative" }}>
                {/* Top bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "rgba(0,0,0,0.6)", zIndex: 10 }}>
                    <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontWeight: "700", fontSize: "0.85rem" }}>← Volver</button>
                    <span style={{ flex: 1, fontWeight: "800", color: "white", fontSize: "0.9rem" }}>{videoTitle}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Código:</span>
                        <button onClick={copyCode} style={{
                            padding: "4px 12px", background: "rgba(99,102,241,0.2)",
                            border: "1px solid rgba(99,102,241,0.4)", borderRadius: "6px",
                            color: "#818cf8", fontWeight: "800", fontSize: "0.8rem",
                            cursor: "pointer", letterSpacing: "2px",
                        }}>
                            {copied ? "✓ Copiado" : code}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                        {members.map((m: any) => (
                            <div key={m.profileId} title={m.profileName} style={{
                                width: 28, height: 28, borderRadius: "50%", background: "#6366f1",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.65rem", fontWeight: "800", color: "white",
                            }}>
                                {(m.profileName || "?").slice(0,2).toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video */}
                {videoUrl ? (
                    isEmbed ? (
                        <iframe
                            ref={iframeRef}
                            src={videoUrl}
                            style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
                            allow="autoplay; fullscreen; encrypted-media"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={videoUrl}
                            controls
                            autoPlay
                            style={{ flex: 1, width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                        />
                    )
                ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", color: "rgba(255,255,255,0.3)" }}>
                        <div style={{ fontSize: "3rem" }}>🎬</div>
                        <div>Sala creada. ¡Comparte el código con tus amigos!</div>
                        <div style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "4px", color: "white" }}>{code}</div>
                    </div>
                )}
            </div>

            {/* Chat sidebar */}
            <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(15,17,23,0.98)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: "800", fontSize: "0.88rem", color: "rgba(255,255,255,0.7)" }}>
                    💬 Chat de sala · {members.length} {members.length === 1 ? "persona" : "personas"}
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.82rem", marginTop: "2rem" }}>
                            Empieza el chat
                        </div>
                    )}
                    {messages.map((m: any) => {
                        const mine = m.profileId === profileId;
                        return (
                            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                                {!mine && <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginBottom: "2px", paddingLeft: "2px" }}>{m.profileName}</span>}
                                <div style={{
                                    maxWidth: "85%", padding: "8px 12px",
                                    borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                    background: mine ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)",
                                    color: "white", fontSize: "0.82rem", lineHeight: "1.4",
                                }}>
                                    {m.content}
                                </div>
                                <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginTop: "2px" }}>
                                    {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={chatEnd} />
                </div>

                <form onSubmit={sendChat} style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "8px" }}>
                    <input
                        value={chatMsg}
                        onChange={e => setChatMsg(e.target.value)}
                        placeholder="Escribe..."
                        style={{
                            flex: 1, padding: "8px 12px",
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px", color: "white", fontSize: "0.85rem", outline: "none",
                        }}
                    />
                    <button type="submit" style={{
                        padding: "8px 14px", background: "#6366f1", border: "none",
                        borderRadius: "8px", color: "white", fontWeight: "800",
                        fontSize: "0.8rem", cursor: "pointer",
                    }}>→</button>
                </form>
            </div>
        </div>
    );
}
