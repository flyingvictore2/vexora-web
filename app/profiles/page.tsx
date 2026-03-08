"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ProfilesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProfileName, setNewProfileName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (session?.user?.email) {
            fetchProfiles();
        } else if (!loading && !session) {
            router.push("/auth/login");
        }
    }, [session]);

    const fetchProfiles = async () => {
        try {
            const res = await axios.get("/api/profiles");
            setProfiles(res.data);
        } catch (error) {
            console.error("Failed to fetch profiles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/profiles", { name: newProfileName });
            setNewProfileName("");
            setIsCreating(false);
            fetchProfiles();
        } catch (error) {
            console.error(error);
        }
    };

    const selectProfile = (profileId: string) => {
        localStorage.setItem("selectedProfileId", profileId);
        router.push("/");
    };

    if (loading) {
        return <div style={{ color: "white", padding: "40px", textAlign: "center", backgroundColor: '#0b0c10', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando perfiles...</div>;
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "white",
            backgroundColor: "#0b0c10",
            padding: '20px'
        }}>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '40px', textAlign: 'center' }}>
                <span style={{ color: '#2563eb', marginRight: '8px' }}>●</span> Series.ly
            </div>

            <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "3rem", opacity: 0.9 }}>¿Quién está viendo?</h1>

            <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {profiles.map((profile) => (
                    <div
                        key={profile.id}
                        onClick={() => selectProfile(profile.id)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "15px" }}
                    >
                        <div
                            style={{
                                width: "160px",
                                height: "160px",
                                position: 'relative',
                                borderRadius: "12px",
                                border: "4px solid rgba(255,255,255,0.05)",
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = "#2563eb";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <img
                                src={profile.image || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                alt={profile.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: "1.3rem", fontWeight: '600' }}>{profile.name}</span>
                    </div>
                ))}

                <div
                    onClick={() => setIsCreating(true)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "15px" }}
                >
                    <div
                        style={{
                            width: "160px",
                            height: "160px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255,255,255,0.02)",
                            border: "2px dashed #4b5563",
                            borderRadius: "12px",
                            fontSize: "4rem",
                            color: "#4b5563",
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.color = "#2563eb";
                            e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.05)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#4b5563";
                            e.currentTarget.style.color = "#4b5563";
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                        }}
                    >
                        +
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: "1.3rem", fontWeight: '600' }}>Añadir perfil</span>
                </div>
            </div>

            <button
                onClick={() => router.push("/account")}
                style={{
                    marginTop: '5rem',
                    padding: '0.8rem 2rem',
                    border: '1px solid #4b5563',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    letterSpacing: '1px'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.borderColor = "white";
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.borderColor = "#4b5563";
                }}
            >
                ADMINISTRAR PERFILES
            </button>

            {isCreating && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "#111827", padding: "40px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ marginBottom: "25px", fontSize: '24px', fontWeight: '800' }}>Añadir perfil</h2>
                        <form onSubmit={handleCreateProfile}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>NOMBRE DEL PERFIL</label>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    placeholder="Mi Perfil"
                                    style={{ padding: "12px", width: "100%", backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)", borderRadius: '8px', color: "white" }}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "12px" }}>GUARDAR</button>
                                <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, padding: "12px", background: "none", border: "1px solid #4b5563", color: "#94a3b8", cursor: "pointer", borderRadius: '8px', fontWeight: '700' }}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
