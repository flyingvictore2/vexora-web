"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

const POLL_MS = 1500; // poll every 1.5 s — fast enough for good sync
const SYNC_THRESHOLD = 2.5; // seek if >2.5 s off

export default function PartyRoomPage() {
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const code = (params.code as string).toUpperCase();

    const [partyData, setPartyData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [chatMsg, setChatMsg] = useState("");
    const [copied, setCopied] = useState(false);
    const [hostStarted, setHostStarted] = useState(false); // local for iframe

    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pollRef = useRef<any>(null);
    const pushRef = useRef<any>(null); // host push interval
    const chatEnd = useRef<HTMLDivElement>(null);
    const latestParty = useRef<any>(null); // latest party state without re-render dep

    useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status]);
    useEffect(() => {
        const pid = localStorage.getItem("selectedProfileId");
        setProfileId(pid);
    }, []);

    const isHost = partyData?.party?.hostProfileId === profileId;
    const party = partyData?.party;
    const isEmbed = (() => {
        const url = party?.episodeVideoUrl || party?.movieVideoUrl || "";
        return url && !url.endsWith(".mp4") && !url.endsWith(".m3u8") && !url.endsWith(".webm");
    })();

    // ── Fetch party state ──────────────────────────────────────────────────────
    const fetchParty = useCallback(async () => {
        const res = await fetch(`/api/social/party?code=${code}`);
        if (!res.ok) { setError("Sala no encontrada"); return null; }
        const data = await res.json();
        latestParty.current = data;
        setPartyData(data);
        return data;
    }, [code]);

    // ── Push host state to DB ─────────────────────────────────────────────────
    const pushHostState = useCallback(async (currentTime: number, isPlaying: boolean) => {
        if (!profileId) return;
        await fetch("/api/social/party", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, profileId, currentTime, isPlaying }),
        });
    }, [code, profileId]);

    // ── Heartbeat (members + host) ────────────────────────────────────────────
    const heartbeat = useCallback(async () => {
        if (!profileId) return;
        await fetch("/api/social/party", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, profileId }),
        });
    }, [code, profileId]);

    // ── Apply sync to native video element ───────────────────────────────────
    const applySync = useCallback((data: any) => {
        const v = videoRef.current;
        if (!v || !data?.party) return;
        const { currentTime: serverTime, isPlaying: serverPlaying, stateAtMs, serverMs } = data.party;
        if (serverTime === undefined || serverMs === undefined) return;

        // Compensate for polling lag: how many seconds have elapsed since the host set this state?
        const lagMs = Date.now() - Number(serverMs); // rough client/server clock diff
        const stateAge = (Date.now() - Number(stateAtMs) + lagMs) / 1000;
        const targetTime = serverPlaying ? serverTime + Math.max(0, stateAge) : serverTime;

        if (Math.abs(v.currentTime - targetTime) > SYNC_THRESHOLD) {
            v.currentTime = targetTime;
        }
        if (serverPlaying && v.paused) {
            v.play().catch(() => {});
        } else if (!serverPlaying && !v.paused) {
            v.pause();
        }
    }, []);

    // ── Poll loop ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!profileId) return;
        fetchParty();
        pollRef.current = setInterval(async () => {
            await heartbeat();
            const data = await fetchParty();
            if (!data) return;

            // Member: sync native video
            if (profileId !== data.party?.hostProfileId) {
                if (!isEmbed) applySync(data);
                // For iframe: just track whether host has started
                if (data.party?.isPlaying) setHostStarted(true);
            }
        }, POLL_MS);
        return () => clearInterval(pollRef.current);
    }, [profileId]); // eslint-disable-line

    // ── Host: push video state while playing ─────────────────────────────────
    useEffect(() => {
        clearInterval(pushRef.current);
        if (!isHost || !videoRef.current) return;
        pushRef.current = setInterval(() => {
            const v = videoRef.current;
            if (!v) return;
            pushHostState(v.currentTime, !v.paused);
        }, 2000);
        return () => clearInterval(pushRef.current);
    }, [isHost, pushHostState]);

    // ── Chat scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        chatEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [partyData?.messages?.length]);

    // ── Host controls ─────────────────────────────────────────────────────────
    const hostPlay = async () => {
        if (!isHost) return;
        if (!isEmbed && videoRef.current) {
            videoRef.current.play().catch(() => {});
            await pushHostState(videoRef.current.currentTime, true);
        } else {
            // iframe: signal everyone to start
            setHostStarted(true);
            await pushHostState(0, true);
        }
    };

    const hostPause = async () => {
        if (!isHost) return;
        if (!isEmbed && videoRef.current) {
            videoRef.current.pause();
            await pushHostState(videoRef.current.currentTime, false);
        } else {
            await pushHostState(0, false);
        }
    };

    // ── Chat ──────────────────────────────────────────────────────────────────
    const sendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMsg.trim() || !profileId) return;
        const msg = chatMsg.trim();
        setChatMsg("");
        await fetch("/api/social/party", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
            <div style={{ fontSize: "3rem" }}>😕</div>
            <h2 style={{ fontWeight: "900" }}>{error}</h2>
            <button onClick={() => router.push("/social/party")} style={{ padding: "10px 22px", background: "#6366f1", border: "none", borderRadius: "8px", color: "white", fontWeight: "800", cursor: "pointer" }}>Volver</button>
        </div>
    );
    if (!partyData) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "rgba(255,255,255,0.4)" }}>Cargando sala...</div>
    );

    const { members, messages } = partyData;
    const videoUrl = party?.episodeVideoUrl || party?.movieVideoUrl || "";
    const videoTitle = party?.episodeTitle || party?.movieTitle || "Sin título";
    const serverIsPlaying = party?.isPlaying ?? false;

    // For iframe: show/hide based on whether host started
    const iframeVisible = isHost ? hostStarted : hostStarted;

    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
            {/* ── Video area ─────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000", position: "relative" }}>

                {/* Top bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(0,0,0,0.7)", zIndex: 10, flexWrap: "wrap" }}>
                    <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontWeight: "700", fontSize: "0.82rem" }}>← Volver</button>
                    <span style={{ flex: 1, fontWeight: "800", color: "white", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoTitle}</span>

                    {/* Code badge */}
                    <button onClick={copyCode} style={{
                        padding: "3px 12px", background: "rgba(99,102,241,0.2)",
                        border: "1px solid rgba(99,102,241,0.4)", borderRadius: "6px",
                        color: "#818cf8", fontWeight: "800", fontSize: "0.78rem",
                        cursor: "pointer", letterSpacing: "2px",
                    }}>
                        {copied ? "✓ Copiado" : `🔗 ${code}`}
                    </button>

                    {/* Member avatars */}
                    <div style={{ display: "flex", gap: 4 }}>
                        {members.map((m: any) => (
                            <div key={m.profileId} title={m.profileName} style={{
                                width: 26, height: 26, borderRadius: "50%", background: "#6366f1",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.6rem", fontWeight: "800", color: "white",
                            }}>
                                {(m.profileName || "?").slice(0, 2).toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* HOST CONTROLS BAR */}
                {isHost && videoUrl && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                        background: "rgba(99,102,241,0.12)", borderBottom: "1px solid rgba(99,102,241,0.2)",
                        zIndex: 10,
                    }}>
                        <span style={{ fontSize: "0.72rem", color: "#a5b4fc", fontWeight: "700" }}>👑 Anfitrión</span>
                        {!serverIsPlaying ? (
                            <button onClick={hostPlay} style={{
                                padding: "7px 22px", background: "#6366f1", border: "none",
                                borderRadius: "8px", color: "white", fontWeight: "800",
                                fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                            }}>
                                ▶ Iniciar para todos
                            </button>
                        ) : (
                            <button onClick={hostPause} style={{
                                padding: "7px 22px", background: "rgba(239,68,68,0.2)",
                                border: "1px solid rgba(239,68,68,0.4)",
                                borderRadius: "8px", color: "#f87171", fontWeight: "800",
                                fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                            }}>
                                ⏸ Pausar para todos
                            </button>
                        )}
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                            {members.length} {members.length === 1 ? "persona" : "personas"} en sala
                        </span>
                    </div>
                )}

                {/* VIDEO */}
                <div style={{ flex: 1, position: "relative", background: "#000" }}>
                    {!videoUrl ? (
                        // No video selected — show waiting screen
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "rgba(255,255,255,0.4)" }}>
                            <div style={{ fontSize: "3rem" }}>🎬</div>
                            <div style={{ fontWeight: "700" }}>Sala creada. Comparte el código con tus amigos.</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "6px", color: "white" }}>{code}</div>
                        </div>
                    ) : isEmbed ? (
                        <>
                            {/* Iframe — src only set when started */}
                            <iframe
                                ref={iframeRef}
                                src={iframeVisible ? videoUrl : "about:blank"}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                                allow="autoplay; fullscreen; encrypted-media"
                                allowFullScreen
                            />
                            {/* Waiting overlay */}
                            {!iframeVisible && (
                                <div style={{
                                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", gap: 16,
                                    background: "rgba(0,0,0,0.92)", zIndex: 5,
                                }}>
                                    {isHost ? (
                                        <>
                                            <div style={{ fontSize: "3rem" }}>🎬</div>
                                            <div style={{ fontWeight: "700", color: "white", fontSize: "1.1rem" }}>Listo para empezar</div>
                                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Pulsa "Iniciar para todos" cuando estéis todos</div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>⏳</div>
                                            <div style={{ fontWeight: "700", color: "white", fontSize: "1.1rem" }}>Esperando al anfitrión...</div>
                                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>La película empezará cuando el anfitrión pulse "Iniciar para todos"</div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Native video */}
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                                // Host uses native controls; members don't (sync overrides anyway)
                                controls={isHost}
                                onPlay={() => { if (isHost) pushHostState(videoRef.current?.currentTime ?? 0, true); }}
                                onPause={() => { if (isHost) pushHostState(videoRef.current?.currentTime ?? 0, false); }}
                                onSeeked={() => { if (isHost) pushHostState(videoRef.current?.currentTime ?? 0, !videoRef.current?.paused); }}
                            />
                            {/* Member waiting overlay */}
                            {!isHost && !serverIsPlaying && (
                                <div style={{
                                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", gap: 16,
                                    background: "rgba(0,0,0,0.85)", zIndex: 5,
                                }}>
                                    <div style={{ fontSize: "3rem" }}>⏳</div>
                                    <div style={{ fontWeight: "700", color: "white", fontSize: "1.1rem" }}>Esperando al anfitrión...</div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>La película empezará cuando el anfitrión pulse "Iniciar para todos"</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Chat sidebar ───────────────────────────────────── */}
            <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(12,14,20,0.98)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: "800", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                    💬 Chat · {members.length} en sala
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", marginTop: "2rem" }}>
                            Empieza el chat
                        </div>
                    )}
                    {messages.map((m: any) => {
                        const mine = m.profileId === profileId;
                        return (
                            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                                {!mine && <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", marginBottom: 2, paddingLeft: 2 }}>{m.profileName}</span>}
                                <div style={{
                                    maxWidth: "85%", padding: "7px 12px",
                                    borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                                    background: mine ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)",
                                    color: "white", fontSize: "0.82rem", lineHeight: 1.4,
                                }}>
                                    {m.content}
                                </div>
                                <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
                                    {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={chatEnd} />
                </div>
                <form onSubmit={sendChat} style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8 }}>
                    <input
                        value={chatMsg}
                        onChange={e => setChatMsg(e.target.value)}
                        placeholder="Escribe..."
                        style={{
                            flex: 1, padding: "8px 12px",
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px", color: "white", fontSize: "0.83rem", outline: "none",
                        }}
                    />
                    <button type="submit" style={{ padding: "8px 14px", background: "#6366f1", border: "none", borderRadius: "8px", color: "white", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer" }}>→</button>
                </form>
            </div>
        </div>
    );
}
