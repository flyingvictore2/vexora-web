"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const avatarEl = (name: string, size = 38) => {
    const initials = (name || "?").slice(0, 2).toUpperCase();
    const colors = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#3b82f6"];
    const color = colors[(name || "?").charCodeAt(0) % colors.length];
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: size * 0.35, color: "white", flexShrink: 0 }}>
            {initials}
        </div>
    );
};

function ChatInner() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const withUserId = searchParams.get("with");

    const [convs, setConvs] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [text, setText] = useState("");
    const [friends, setFriends] = useState<any[]>([]);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const pollRef = useRef<any>(null);

    useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status]);
    useEffect(() => { fetchConvs(); fetchFriends(); }, []);

    useEffect(() => {
        if (withUserId) {
            openConversation(withUserId);
        }
    }, [withUserId]);

    useEffect(() => {
        if (!currentUser) return;
        // Poll for new messages every 2s
        pollRef.current = setInterval(() => fetchMessages(currentUser.id), 2000);
        return () => clearInterval(pollRef.current);
    }, [currentUser]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConvs = async () => {
        const res = await fetch("/api/social/messages");
        if (res.ok) setConvs(await res.json());
    };

    const fetchFriends = async () => {
        const res = await fetch("/api/social/friends");
        if (res.ok) {
            const d = await res.json();
            setFriends(d.friends || []);
        }
    };

    const fetchMessages = async (uid: string) => {
        const res = await fetch(`/api/social/messages?withUserId=${uid}`);
        if (res.ok) {
            const msgs = await res.json();
            setMessages(msgs);
        }
    };

    const openConversation = async (uid: string) => {
        clearInterval(pollRef.current);
        // find user info from friends or convs
        const friend = friends.find(f => f.userId === uid) ||
            convs.find(c => c.otherUserId === uid);
        setCurrentUser({ id: uid, name: friend?.name || friend?.username || uid });
        await fetchMessages(uid);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !currentUser) return;
        const body = text.trim();
        setText("");
        await fetch("/api/social/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toUserId: currentUser.id, content: body }),
        });
        fetchMessages(currentUser.id);
    };

    const myId = (session?.user as any)?.id;

    // Show all unique people: friends + existing convs
    const allContacts: any[] = [];
    const seen = new Set<string>();
    for (const f of friends) {
        if (!seen.has(f.userId)) { allContacts.push({ id: f.userId, name: f.name || f.username || f.email, unread: 0 }); seen.add(f.userId); }
    }
    for (const c of convs) {
        if (!seen.has(c.otherUserId)) { allContacts.push({ id: c.otherUserId, name: c.name || c.username || c.email, unread: c.unreadCount || 0 }); seen.add(c.otherUserId); }
        else {
            const existing = allContacts.find(a => a.id === c.otherUserId);
            if (existing) existing.unread = c.unreadCount || 0;
        }
    }

    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)", maxWidth: 1100, margin: "0 auto", padding: "1rem", gap: "1rem" }}>
            {/* Sidebar */}
            <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "900", marginBottom: "0.75rem", paddingLeft: "4px" }}>💬 Mensajes</h2>
                {allContacts.length === 0 && (
                    <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", padding: "1rem 4px" }}>
                        Añade amigos para chatear
                    </div>
                )}
                {allContacts.map(c => (
                    <button key={c.id} onClick={() => openConversation(c.id)} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                        background: currentUser?.id === c.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        textAlign: "left", transition: "background 0.15s",
                    }}>
                        {avatarEl(c.name)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "700", color: "white", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        </div>
                        {c.unread > 0 && (
                            <span style={{ background: "#6366f1", color: "white", borderRadius: "10px",
                                fontSize: "0.65rem", fontWeight: "800", padding: "2px 7px", minWidth: 20, textAlign: "center" }}>
                                {c.unread}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Chat area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                {!currentUser ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.95rem" }}>
                        Selecciona una conversación para empezar
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "12px" }}>
                            {avatarEl(currentUser.name, 36)}
                            <span style={{ fontWeight: "800", fontSize: "1rem", color: "white" }}>{currentUser.name}</span>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {messages.map((m: any) => {
                                const mine = m.senderUserId === myId;
                                return (
                                    <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "68%", padding: "9px 14px", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: mine ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)",
                                            color: "white", fontSize: "0.88rem", lineHeight: "1.4",
                                        }}>
                                            {m.content}
                                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: "4px", textAlign: mine ? "right" : "left" }}>
                                                {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", marginTop: "2rem" }}>
                                    Empieza la conversación
                                </div>
                            )}
                            <div ref={messagesEnd} />
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "10px" }}>
                            <input
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                style={{
                                    flex: 1, padding: "10px 16px",
                                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px", color: "white", fontSize: "0.9rem", outline: "none",
                                }}
                            />
                            <button type="submit" style={{
                                padding: "10px 20px", background: "#6366f1", border: "none",
                                borderRadius: "10px", color: "white", fontWeight: "800",
                                fontSize: "0.85rem", cursor: "pointer",
                            }}>Enviar</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return <Suspense><ChatInner /></Suspense>;
}
