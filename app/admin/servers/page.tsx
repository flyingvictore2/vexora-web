"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface VideoServer {
    id: string;
    name: string;
    url: string;
    quality: string;
    movieId?: string | null;
    episodeId?: string | null;
    movie?: { title: string } | null;
    episode?: {
        title: string;
        episodeNumber: number;
        seasonNumber: number;
        movie: { title: string };
    } | null;
}

interface ContentResult {
    id: string;
    title: string;
    type: "MOVIE" | "EPISODE";
}

const QUALITIES = ["4K", "HD 1080P", "HD 720P", "SD 480P"];

export default function AdminServers() {
    const [servers, setServers] = useState<VideoServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        url: "",
        quality: "HD 1080P",
        movieId: "",
        episodeId: ""
    });

    // Content search states
    const [contentSearch, setContentSearch] = useState("");
    const [searchResults, setSearchResults] = useState<ContentResult[]>([]);
    const [selectedContent, setSelectedContent] = useState<ContentResult | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchServers = async () => {
        try {
            const res = await axios.get("/api/admin/servers");
            setServers(res.data);
        } catch (error) {
            console.error("Error fetching servers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchServers(); }, []);

    // Search content for modal
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (contentSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await axios.get(`/api/admin/content/search?q=${contentSearch}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error(err);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [contentSearch]);

    const filteredServers = servers.filter(s => {
        const title = s.movie?.title || s.episode?.movie.title || "";
        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.url.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ name: "", url: "", quality: "HD 1080P", movieId: "", episodeId: "" });
        setSelectedContent(null);
        setContentSearch("");
        setIsModalOpen(true);
    };

    const openEditModal = (server: VideoServer) => {
        setIsEditing(true);
        setEditingId(server.id);
        setFormData({
            name: server.name,
            url: server.url,
            quality: server.quality,
            movieId: server.movieId || "",
            episodeId: server.episodeId || ""
        });

        // Setup selected content for UI
        const contentTitle = server.movie?.title || (server.episode ? `${server.episode.movie.title} - ${server.episode.seasonNumber}x${server.episode.episodeNumber}` : "");
        setSelectedContent({
            id: server.movieId || server.episodeId || "",
            title: contentTitle,
            type: server.movieId ? "MOVIE" : "EPISODE"
        });

        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedContent) {
            showToast("Debes seleccionar una película o episodio", false);
            return;
        }

        const payload = {
            ...formData,
            movieId: selectedContent.type === "MOVIE" ? selectedContent.id : null,
            episodeId: selectedContent.type === "EPISODE" ? selectedContent.id : null
        };

        try {
            if (isEditing && editingId) {
                await axios.put(`/api/admin/servers?id=${editingId}`, payload);
                showToast("Servidor actualizado");
            } else {
                await axios.post("/api/admin/servers", payload);
                showToast("Servidor añadido correctamente");
            }
            setIsModalOpen(false);
            fetchServers();
        } catch (error) {
            showToast("Error al guardar el servidor", false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este servidor?")) return;
        try {
            await axios.delete(`/api/admin/servers?id=${id}`);
            showToast("Servidor eliminado");
            fetchServers();
        } catch {
            showToast("Error al eliminar", false);
        }
    };

    const selectContent = (content: ContentResult) => {
        setSelectedContent(content);
        setSearchResults([]);
        setContentSearch("");
    };

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Cargando servidores...</div>;

    return (
        <div style={{ maxWidth: "1600px" }}>
            {toast && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
                    padding: "16px 24px", borderRadius: "12px", fontWeight: "700",
                    backgroundColor: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: toast.ok ? "var(--success)" : "var(--error)",
                    backdropFilter: "blur(10px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                    {toast.ok ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Gestión de Servidores</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Configura los espejos de video para todas las películas y series.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontWeight: "800", borderRadius: "12px" }}
                >
                    + NUEVO SERVIDOR
                </button>
            </header>

            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Buscar por título, servidor o URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "14px 20px",
                            paddingLeft: "45px",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "white",
                            fontSize: "0.95rem"
                        }}
                    />
                    <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            <section className="glass-card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <th style={thStyle}>SERVIDOR</th>
                            <th style={thStyle}>CALIDAD</th>
                            <th style={thStyle}>ASOCIADO A</th>
                            <th style={thStyle}>URL</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredServers.map((server) => (
                            <tr key={server.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <div style={{ fontWeight: "800", color: "white" }}>{server.name}</div>
                                </td>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "800",
                                        backgroundColor: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)"
                                    }}>
                                        {server.quality}
                                    </span>
                                </td>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <div style={{ fontSize: "0.9rem", color: "white", fontWeight: "600" }}>
                                        {server.movie?.title || server.episode?.movie.title}
                                    </div>
                                    {server.episode && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "700" }}>
                                            Episodio {server.episode.seasonNumber}x{server.episode.episodeNumber}: {server.episode.title}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: "1.2rem 1rem" }}>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {server.url}
                                    </div>
                                </td>
                                <td style={{ padding: "1.2rem 1rem", textAlign: "right" }}>
                                    <button onClick={() => openEditModal(server)} style={{ color: "var(--primary)", fontWeight: "700", marginRight: "15px", background: "none", border: "none", cursor: "pointer" }}>Editar</button>
                                    <button onClick={() => handleDelete(server.id)} style={{ color: "#ef4444", fontWeight: "700", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredServers.length === 0 && (
                    <div style={{ padding: "5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No se encontraron servidores.
                    </div>
                )}
            </section>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h2 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "2rem" }}>
                            {isEditing ? "Editar Servidor" : "Añadir Nuevo Servidor"}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "30px" }}>

                                {/* Content Selection */}
                                <div style={{ position: "relative" }}>
                                    <label style={labelStyle}>Pelicula / Episodio</label>
                                    {selectedContent ? (
                                        <div style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "12px 16px", backgroundColor: "rgba(37,99,235,0.1)",
                                            border: "1px solid rgba(37,99,235,0.3)", borderRadius: "10px", color: "white"
                                        }}>
                                            <span style={{ fontWeight: "700" }}>{selectedContent.title}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedContent(null)}
                                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "900" }}
                                            >
                                                CAMBIAR
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Busca una película o serie para asociarla..."
                                                value={contentSearch}
                                                onChange={(e) => setContentSearch(e.target.value)}
                                                style={inputStyle}
                                            />
                                            {searchResults.length > 0 && (
                                                <div style={{
                                                    position: "absolute", top: "100%", left: 0, width: "100%",
                                                    backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "10px", marginTop: "5px", zIndex: 10, overflow: "hidden",
                                                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                                                }}>
                                                    {searchResults.map(res => (
                                                        <div
                                                            key={res.id}
                                                            onClick={() => selectContent(res)}
                                                            style={{
                                                                padding: "12px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                                transition: "all 0.2s"
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                                        >
                                                            <div style={{ fontWeight: "700", color: "white", fontSize: "0.9rem" }}>{res.title}</div>
                                                            <div style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: "800" }}>{res.type}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div>
                                        <label style={labelStyle}>Nombre del Servidor</label>
                                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Ej: StreamCloud, VOE..." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Calidad</label>
                                        <select value={formData.quality} onChange={e => setFormData({ ...formData, quality: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                            {QUALITIES.map(q => <option key={q} value={q} style={{ color: "black" }}>{q}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>URL del Video</label>
                                    <input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required placeholder="https://..." style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "15px" }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: "50px", fontWeight: "900" }}>
                                    {isEditing ? "GUARDAR CAMBIOS" : "AÑADIR SERVIDOR"}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, height: "50px", fontWeight: "800" }}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: "1.2rem 1rem",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "var(--text-secondary)",
    letterSpacing: "1px",
    textTransform: "uppercase"
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px"
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.2s"
};
