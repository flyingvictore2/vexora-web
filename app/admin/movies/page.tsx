"use client";

import React, { useEffect, useState } from "react";

interface Movie {
    id: string;
    title: string;
    genre: string;
    year: number;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    rating: string;
    type: string;
    requiredPlan: string;
    releaseDate?: string | null;
    trailerUrl?: string | null;
    hidden?: boolean;
}

interface Episode {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoUrl: string;
    episodeNumber: number;
    seasonNumber: number;
    movieId: string;
}

interface VideoServer {
    id: string;
    name: string;
    url: string;
    quality: string;
    movieId?: string | null;
    episodeId?: string | null;
}

const CONTENT_TYPES = [
    { value: "MOVIE", label: "🎬 Película" },
    { value: "SERIE", label: "📺 Serie" },
    { value: "ANIME", label: "⛩️ Anime" },
    { value: "DOCUMENTAL", label: "🎥 Documental" },
];

const PLANS = [
    { value: "FREE", label: "🆓 Gratis (todos)" },
    { value: "BASIC", label: "🥉 Básico+" },
    { value: "STANDARD", label: "🥈 Estándar+" },
    { value: "PREMIUM", label: "🥇 Premium" },
];

const GENRES = [
    "Acción", "Aventura", "Animación", "Ciencia Ficción", "Comedia",
    "Crimen", "Drama", "Fantasía", "Historia", "Horror",
    "Misterio", "Música", "Romance", "Suspense", "Terror",
    "Thriller", "Familiar", "Deportes", "Western", "Bélico",
    "Superhéroes", "Sobrenatural", "Biopic", "Documental",
];

const TYPE_COLORS: Record<string, string> = {
    MOVIE: "#2563eb",
    SERIE: "#7c3aed",
    ANIME: "#db2777",
    DOCUMENTAL: "#d97706",
};

const PLAN_COLORS: Record<string, string> = {
    FREE: "#10b981",
    BASIC: "#cd7f32",
    STANDARD: "#c0c0c0",
    PREMIUM: "#fbbf24",
};

const EMPTY_FORM = {
    title: "",
    genre: "",
    year: new Date().getFullYear(),
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    trailerUrl: "",
    duration: "",
    rating: "G",
    type: "MOVIE",
    requiredPlan: "FREE",
    releaseDate: "",
};

export default function AdminMovies() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Episode Management State
    const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [isEditingEpisode, setIsEditingEpisode] = useState(false);
    const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
    const [episodeFormData, setEpisodeFormData] = useState({
        title: "",
        description: "",
        thumbnailUrl: "",
        videoUrl: "",
        episodeNumber: 1,
        seasonNumber: 1,
    });

    // Server Management State
    const [isServerModalOpen, setIsServerModalOpen] = useState(false);
    const [servers, setServers] = useState<VideoServer[]>([]);
    const [serverTarget, setServerTarget] = useState<{ id: string, type: "MOVIE" | "EPISODE", title: string } | null>(null);
    const [editingServer, setEditingServer] = useState<VideoServer | null>(null);
    const [serverFormData, setServerFormData] = useState({
        name: "",
        url: "",
        quality: "HD 1080P"
    });

    const QUALITIES = ["4K", "HD 1080P", "HD 720P", "SD 480P"];

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchMovies = async () => {
        try {
            const res = await fetch("/api/admin/movies");
            if (!res.ok) throw new Error("Error fetching");
            const data = await res.json();
            setMovies(data);
        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMovies(); }, []);

    const toggleHidden = async (movie: Movie) => {
        setTogglingId(movie.id);
        try {
            const newHidden = !movie.hidden;
            const res = await fetch(`/api/admin/movies/${movie.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hidden: newHidden }),
            });
            if (!res.ok) throw new Error("Error");
            setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, hidden: newHidden } : m));
            showToast(newHidden ? "🙈 Título ocultado" : "👁️ Título visible");
        } catch {
            showToast("Error al cambiar visibilidad", false);
        } finally {
            setTogglingId(null);
        }
    };

    const filteredMovies = movies.filter(m => {
        const matchSearch =
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.genre.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterType === "HIDDEN") return matchSearch && !!m.hidden;
        const matchType = filterType === "ALL" || m.type === filterType;
        return matchSearch && matchType;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMovie) {
                const res = await fetch(`/api/admin/movies/${editingMovie.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error("Failed to update");
                showToast("Título actualizado correctamente");
            } else {
                const res = await fetch("/api/admin/movies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error("Failed to create");
                showToast("Contenido publicado correctamente");
            }
            setIsModalOpen(false);
            setEditingMovie(null);
            setFormData(EMPTY_FORM);
            fetchMovies();
        } catch {
            showToast("Error al guardar el título", false);
        }
    };

    const confirmDelete = (movie: Movie) => {
        setDeleteTarget(movie);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/movies/${deleteTarget.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error deleting");
            setDeleteTarget(null);
            setIsModalOpen(false);
            setEditingMovie(null);
            showToast("Título eliminado correctamente");
            await fetchMovies();
        } catch {
            showToast("Error al eliminar el título", false);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchEpisodes = async (movieId: string) => {
        try {
            const res = await fetch(`/api/admin/episodes?movieId=${movieId}`);
            if (!res.ok) throw new Error("Failed to fetch episodes");
            const data = await res.json();
            setEpisodes(data);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar episodios", false);
        }
    };

    const handleEpisodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMovie) return;

        try {
            const url = editingEpisode
                ? `/api/admin/episodes?id=${editingEpisode.id}`
                : "/api/admin/episodes";
            const method = editingEpisode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...episodeFormData, movieId: editingMovie.id }),
            });

            if (!res.ok) throw new Error("Failed to save episode");

            showToast(editingEpisode ? "Episodio actualizado" : "Episodio creado");
            setIsEditingEpisode(false);
            setEditingEpisode(null);
            setEpisodeFormData({
                title: "",
                description: "",
                thumbnailUrl: "",
                videoUrl: "",
                episodeNumber: episodes.length + 1,
                seasonNumber: 1,
            });
            fetchEpisodes(editingMovie.id);
        } catch {
            showToast("Error al guardar episodio", false);
        }
    };

    const deleteEpisode = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este episodio?")) return;
        try {
            const res = await fetch(`/api/admin/episodes?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            showToast("Episodio eliminado");
            if (editingMovie) fetchEpisodes(editingMovie.id);
        } catch {
            showToast("Error al eliminar episodio", false);
        }
    };

    const fetchServers = async (id: string, type: "MOVIE" | "EPISODE") => {
        try {
            const res = await fetch(`/api/admin/servers?${type === "MOVIE" ? "movieId" : "episodeId"}=${id}`);
            if (!res.ok) throw new Error("Failed to fetch servers");
            const data = await res.json();
            setServers(data);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar servidores", false);
        }
    };

    const handleServerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serverTarget) return;

        try {
            const body = {
                ...serverFormData,
                movieId: serverTarget.type === "MOVIE" ? serverTarget.id : null,
                episodeId: serverTarget.type === "EPISODE" ? serverTarget.id : null
            };

            const url = editingServer
                ? `/api/admin/servers?id=${editingServer.id}`
                : "/api/admin/servers";
            const method = editingServer ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save server");

            showToast(editingServer ? "Servidor actualizado" : "Servidor añadido");
            setServerFormData({ name: "", url: "", quality: "HD 1080P" });
            setEditingServer(null);
            fetchServers(serverTarget.id, serverTarget.type);
        } catch {
            showToast("Error al guardar servidor", false);
        }
    };

    const deleteServer = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este servidor?")) return;
        try {
            const res = await fetch(`/api/admin/servers?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete server");
            showToast("Servidor eliminado");
            if (serverTarget) fetchServers(serverTarget.id, serverTarget.type);
        } catch {
            showToast("Error al eliminar servidor", false);
        }
    };

    const openServerModal = (id: string, type: "MOVIE" | "EPISODE", title: string) => {
        setServerTarget({ id, type, title });
        setEditingServer(null);
        setServerFormData({ name: "", url: "", quality: "HD 1080P" });
        fetchServers(id, type);
        setIsServerModalOpen(true);
    };

    const openEdit = (movie: Movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            genre: movie.genre,
            year: movie.year,
            description: movie.description,
            thumbnailUrl: movie.thumbnailUrl,
            videoUrl: movie.videoUrl,
            trailerUrl: movie.trailerUrl || "",
            duration: movie.duration,
            rating: movie.rating,
            type: movie.type || "MOVIE",
            requiredPlan: movie.requiredPlan || "FREE",
            releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : "",
        });
        setIsModalOpen(true);
    };

    if (loading) return <div style={{ color: "var(--primary)", textAlign: "center", padding: "100px", fontWeight: "700" }}>Sincronizando biblioteca multimedia...</div>;

    return (
        <>
            <div style={{ maxWidth: "1600px" }}>
                {/* Toast */}
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

                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1.5px", marginBottom: "0.5rem" }}>Biblioteca Multimedia</h1>
                        <p style={{ color: "var(--text-secondary)" }}>
                            {movies.length} títulos · {movies.filter(m => m.type === "MOVIE").length} películas · {movies.filter(m => m.type === "SERIE").length} series · {movies.filter(m => m.type === "ANIME").length} animes
                            {movies.filter(m => m.hidden).length > 0 && (
                                <span style={{ marginLeft: "8px", color: "rgba(239,68,68,0.7)", fontWeight: "700" }}>
                                    · {movies.filter(m => m.hidden).length} ocultos
                                </span>
                            )}
                        </p>
                    </div>
                    <button type="button" onClick={() => { setEditingMovie(null); setFormData(EMPTY_FORM); setIsModalOpen(true); }} className="btn btn-primary">
                        + NUEVO TÍTULO
                    </button>
                </header>

                {/* Filters bar */}
                <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
                        <input
                            type="text"
                            placeholder="Buscar por título o género..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ ...inputStyle, width: "100%", paddingLeft: "40px" }}
                        />
                        <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                    </div>
                    {/* Type filter buttons */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        {["ALL", "MOVIE", "SERIE", "ANIME", "DOCUMENTAL", "HIDDEN"].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFilterType(t)}
                                style={{
                                    padding: "8px 14px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "800",
                                    cursor: "pointer", border: "1px solid",
                                    backgroundColor: filterType === t
                                        ? t === "HIDDEN" ? "rgba(239,68,68,0.15)" : "rgba(37,99,235,0.15)"
                                        : "rgba(255,255,255,0.03)",
                                    borderColor: filterType === t
                                        ? t === "HIDDEN" ? "rgba(239,68,68,0.4)" : "rgba(37,99,235,0.4)"
                                        : "rgba(255,255,255,0.08)",
                                    color: filterType === t ? "white" : "var(--text-secondary)",
                                }}
                            >
                                {t === "ALL" ? "Todos" : t === "HIDDEN" ? `🙈 Ocultos${movies.filter(m => m.hidden).length > 0 ? ` (${movies.filter(m => m.hidden).length})` : ""}` : CONTENT_TYPES.find(c => c.value === t)?.label}
                            </button>
                        ))}
                    </div>
                </div>

                <section className="glass-card" style={{ overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={thStyle}>CONTENIDO</th>
                                <th style={thStyle}>TIPO</th>
                                <th style={thStyle}>GÉNERO</th>
                                <th style={thStyle}>AÑO</th>
                                <th style={thStyle}>PLAN</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovies.map((movie) => (
                                <tr key={movie.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                            <div style={{ position: "relative", flexShrink: 0 }}>
                                                <img src={movie.thumbnailUrl} alt={movie.title} style={{ width: "80px", height: "45px", objectFit: "cover", borderRadius: "4px", backgroundColor: "#222", opacity: movie.hidden ? 0.35 : 1, transition: "opacity 0.2s" }} />
                                                {movie.hidden && (
                                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🙈</div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "800", color: movie.hidden ? "rgba(255,255,255,0.4)" : "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {movie.title}
                                                    {movie.hidden && (
                                                        <span style={{ fontSize: "0.65rem", fontWeight: "800", padding: "2px 7px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", letterSpacing: "0.5px" }}>OCULTO</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{movie.duration}</div>
                                                {movie.releaseDate && new Date(movie.releaseDate) > new Date() && (
                                                    <div style={{ marginTop: "4px", fontSize: "0.7rem", fontWeight: "800", color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                                                        ⏰ ESTRENO — {new Date(movie.releaseDate).toLocaleDateString("es-ES")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "800",
                                            backgroundColor: `${TYPE_COLORS[movie.type] || "#2563eb"}22`,
                                            color: TYPE_COLORS[movie.type] || "#2563eb",
                                            border: `1px solid ${TYPE_COLORS[movie.type] || "#2563eb"}44`,
                                        }}>
                                            {CONTENT_TYPES.find(c => c.value === movie.type)?.label || movie.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                                            {movie.genre}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{movie.year}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "800",
                                            backgroundColor: `${PLAN_COLORS[movie.requiredPlan] || "#10b981"}22`,
                                            color: PLAN_COLORS[movie.requiredPlan] || "#10b981",
                                            border: `1px solid ${PLAN_COLORS[movie.requiredPlan] || "#10b981"}44`,
                                        }}>
                                            {PLANS.find(p => p.value === movie.requiredPlan)?.label || movie.requiredPlan}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                            <button
                                                type="button"
                                                onClick={() => toggleHidden(movie)}
                                                disabled={togglingId === movie.id}
                                                title={movie.hidden ? "Mostrar" : "Ocultar"}
                                                style={{
                                                    padding: "5px 12px", borderRadius: "7px", fontSize: "0.75rem", fontWeight: "800",
                                                    cursor: togglingId === movie.id ? "wait" : "pointer", border: "1px solid",
                                                    background: movie.hidden ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
                                                    borderColor: movie.hidden ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)",
                                                    color: movie.hidden ? "#10b981" : "rgba(239,68,68,0.7)",
                                                    opacity: togglingId === movie.id ? 0.5 : 1,
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {togglingId === movie.id ? "..." : movie.hidden ? "👁️ Mostrar" : "🙈 Ocultar"}
                                            </button>
                                            <button type="button" onClick={() => openEdit(movie)} style={{ color: "var(--primary)", fontWeight: "700", background: "none", border: "none", cursor: "pointer" }}>Editar</button>
                                            <button type="button" onClick={() => confirmDelete(movie)} style={{ color: "#ef4444", fontWeight: "700", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMovies.length === 0 && (
                        <div style={{ padding: "5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                            No se encontraron títulos con ese criterio.
                        </div>
                    )}
                </section>

                {/* DELETE MODAL */}
                {deleteTarget && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
                        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "480px", textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗑️</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "1rem" }}>¿Eliminar este título?</h2>
                            <p style={{ fontWeight: "800", color: "white", fontSize: "1.1rem", marginBottom: "0.5rem" }}>&quot;{deleteTarget.title}&quot;</p>
                            <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "2rem" }}>Esta acción no se puede deshacer.</p>
                            <div style={{ display: "flex", gap: "15px" }}>
                                <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={isDeleting}>Cancelar</button>
                                <button type="button" onClick={handleDelete} className="btn btn-primary" style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)", color: "#ef4444" }} disabled={isDeleting}>
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT/ADD MODAL */}
                {isModalOpen && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "820px", maxHeight: "90vh", overflowY: "auto" }}>
                            <h2 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "2rem" }}>
                                {editingMovie ? "Editar Título" : "Añadir Nuevo Contenido"}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

                                    {/* TIPO DE CONTENIDO */}
                                    <div>
                                        <label style={labelStyle}>Tipo de Contenido</label>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {CONTENT_TYPES.map(ct => (
                                                <button
                                                    key={ct.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: ct.value })}
                                                    style={{
                                                        padding: "8px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700",
                                                        cursor: "pointer", border: "1px solid",
                                                        backgroundColor: formData.type === ct.value ? `${TYPE_COLORS[ct.value]}22` : "rgba(255,255,255,0.03)",
                                                        borderColor: formData.type === ct.value ? `${TYPE_COLORS[ct.value]}66` : "rgba(255,255,255,0.08)",
                                                        color: formData.type === ct.value ? TYPE_COLORS[ct.value] : "var(--text-secondary)",
                                                        transition: "all 0.2s",
                                                    }}
                                                >
                                                    {ct.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* PLAN REQUERIDO */}
                                    <div>
                                        <label style={labelStyle}>Plan Necesario para Ver</label>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {PLANS.map(p => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, requiredPlan: p.value })}
                                                    style={{
                                                        padding: "8px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700",
                                                        cursor: "pointer", border: "1px solid",
                                                        backgroundColor: formData.requiredPlan === p.value ? `${PLAN_COLORS[p.value]}22` : "rgba(255,255,255,0.03)",
                                                        borderColor: formData.requiredPlan === p.value ? `${PLAN_COLORS[p.value]}66` : "rgba(255,255,255,0.08)",
                                                        color: formData.requiredPlan === p.value ? PLAN_COLORS[p.value] : "var(--text-secondary)",
                                                        transition: "all 0.2s",
                                                    }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TÍTULO */}
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={labelStyle}>Título de la obra</label>
                                        <input placeholder="Ej: Stranger Things" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={inputStyle} />
                                    </div>

                                    {/* GÉNERO */}
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={labelStyle}>Género</label>
                                        <div style={{
                                            padding: "12px 14px",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "10px",
                                            display: "flex", flexWrap: "wrap", gap: "7px",
                                        }}>
                                            {GENRES.map(g => {
                                                const selected = formData.genre.split(",").map(s => s.trim()).filter(Boolean).includes(g);
                                                return (
                                                    <button
                                                        key={g}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = formData.genre ? formData.genre.split(",").map(s => s.trim()).filter(Boolean) : [];
                                                            const next = selected ? current.filter(x => x !== g) : [...current, g];
                                                            setFormData({ ...formData, genre: next.join(", ") });
                                                        }}
                                                        style={{
                                                            padding: "5px 13px",
                                                            borderRadius: "20px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            border: "1px solid",
                                                            backgroundColor: selected ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.04)",
                                                            borderColor: selected ? "rgba(37,99,235,0.55)" : "rgba(255,255,255,0.1)",
                                                            color: selected ? "#60a5fa" : "rgba(255,255,255,0.5)",
                                                            transition: "all 0.15s",
                                                        }}
                                                        onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                                                        onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                                                    >
                                                        {selected && <span style={{ marginRight: "4px" }}>✓</span>}{g}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {formData.genre && (
                                            <p style={{ marginTop: "6px", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                                                Seleccionado: <span style={{ color: "#60a5fa" }}>{formData.genre}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* AÑO */}
                                    <div>
                                        <label style={labelStyle}>Año de lanzamiento</label>
                                        <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required style={inputStyle} />
                                    </div>
                                    <div />

                                    {/* DESCRIPCIÓN */}
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={labelStyle}>Descripción / Sinopsis</label>
                                        <textarea placeholder="Describe brevemente la trama..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} />
                                    </div>

                                    {/* URLs */}
                                    <div>
                                        <label style={labelStyle}>URL Miniatura (Poster)</label>
                                        <input placeholder="https://..." value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} required style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>URL del Video</label>
                                        <input placeholder="https://..." value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} required style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={labelStyle}>URL del Tráiler (opcional) — YouTube embed</label>
                                        <input
                                            placeholder="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1"
                                            value={(formData as any).trailerUrl || ""}
                                            onChange={e => setFormData({ ...formData, trailerUrl: e.target.value } as any)}
                                            style={inputStyle}
                                        />
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "5px" }}>
                                            Se reproduce automáticamente al pasar el cursor sobre la miniatura en las filas de inicio.
                                        </p>
                                    </div>

                                    {/* DURACIÓN + CALIFICACIÓN */}
                                    <div>
                                        <label style={labelStyle}>Duración</label>
                                        <input placeholder="Ej: 2h 15m o 4 Temporadas" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Calificación de Edad</label>
                                        <input placeholder="Ej: 13+, 18+, G" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} required style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={labelStyle}>Fecha de Estreno (Programación)</label>
                                        <input type="date" value={formData.releaseDate} onChange={e => setFormData({ ...formData, releaseDate: e.target.value })} style={inputStyle} />
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "5px" }}>
                                            Si se deja vacío, el contenido será visible inmediatamente. Si se programa para el futuro, solo será visible en el Calendario y para administradores.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "15px", marginTop: "2rem" }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                        {editingMovie ? "Guardar Cambios" : "Publicar Contenido"}
                                    </button>
                                    {editingMovie && (
                                        <button type="button" onClick={() => { setIsModalOpen(false); confirmDelete(editingMovie); }} className="btn btn-secondary" style={{ flex: 1, backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                            Eliminar
                                        </button>
                                    )}
                                    {editingMovie && (formData.type === "SERIE" || formData.type === "ANIME") && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                fetchEpisodes(editingMovie!.id);
                                                setIsEpisodeModalOpen(true);
                                            }}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, backgroundColor: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}
                                        >
                                            📺 Gestionar Episodios
                                        </button>
                                    )}
                                    {editingMovie && (formData.type === "MOVIE" || formData.type === "DOCUMENTAL") && (
                                        <button
                                            type="button"
                                            onClick={() => openServerModal(editingMovie!.id, "MOVIE", editingMovie!.title)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, backgroundColor: "rgba(37,99,235,0.1)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.2)" }}
                                        >
                                            🌐 Servidores
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Descartar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* EPISODES MODAL */}
            {
                isEpisodeModalOpen && editingMovie && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, padding: "20px" }}>
                        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <h2 style={{ fontSize: "1.8rem", fontWeight: "900" }}>Episodios: {editingMovie.title}</h2>
                                <button onClick={() => setIsEpisodeModalOpen(false)} className="btn btn-secondary">Cerrar</button>
                            </div>

                            {!isEditingEpisode ? (
                                <div>
                                    <button
                                        onClick={() => {
                                            if (!editingMovie) return;
                                            setIsEditingEpisode(true);
                                            setEditingEpisode(null);
                                            setEpisodeFormData({
                                                title: "",
                                                description: "",
                                                thumbnailUrl: editingMovie.thumbnailUrl,
                                                videoUrl: "",
                                                episodeNumber: episodes.length + 1,
                                                seasonNumber: 1,
                                            });
                                        }}
                                        className="btn btn-primary"
                                        style={{ marginBottom: "2rem" }}
                                    >
                                        + AÑADIR EPISODIO
                                    </button>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {episodes.map(ep => (
                                            <div key={ep.id} className="glass-card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)" }}>
                                                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                                    <div style={{ color: "var(--primary)", fontWeight: "900", fontSize: "1.2rem", width: "40px" }}>
                                                        {ep.seasonNumber}x{ep.episodeNumber}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: "700" }}>{ep.title}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{ep.videoUrl.substring(0, 50)}...</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button onClick={() => {
                                                        setEditingEpisode(ep);
                                                        setEpisodeFormData({
                                                            title: ep.title,
                                                            description: ep.description,
                                                            thumbnailUrl: ep.thumbnailUrl,
                                                            videoUrl: ep.videoUrl,
                                                            episodeNumber: ep.episodeNumber,
                                                            seasonNumber: ep.seasonNumber,
                                                        });
                                                        setIsEditingEpisode(true);
                                                    }} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}>Editar</button>
                                                    <button onClick={() => openServerModal(ep.id, "EPISODE", `${editingMovie.title} - ${ep.seasonNumber}x${ep.episodeNumber}: ${ep.title}`)} style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}>Servidores</button>
                                                    <button onClick={() => deleteEpisode(ep.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}>Eliminar</button>
                                                </div>
                                            </div>
                                        ))}
                                        {episodes.length === 0 && <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>No hay episodios para esta serie todavía.</div>}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleEpisodeSubmit}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                                        <div>
                                            <label style={labelStyle}>Número de Temporada</label>
                                            <input type="number" value={episodeFormData.seasonNumber} onChange={e => setEpisodeFormData({ ...episodeFormData, seasonNumber: parseInt(e.target.value) })} style={inputStyle} required />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Número de Episodio</label>
                                            <input type="number" value={episodeFormData.episodeNumber} onChange={e => setEpisodeFormData({ ...episodeFormData, episodeNumber: parseInt(e.target.value) })} style={inputStyle} required />
                                        </div>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={labelStyle}>Título del Episodio</label>
                                            <input value={episodeFormData.title} onChange={e => setEpisodeFormData({ ...episodeFormData, title: e.target.value })} style={inputStyle} required />
                                        </div>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={labelStyle}>Descripción</label>
                                            <textarea value={episodeFormData.description} onChange={e => setEpisodeFormData({ ...episodeFormData, description: e.target.value })} style={{ ...inputStyle, minHeight: "80px" }} required />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>URL Miniatura</label>
                                            <input value={episodeFormData.thumbnailUrl} onChange={e => setEpisodeFormData({ ...episodeFormData, thumbnailUrl: e.target.value })} style={inputStyle} required />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>URL Video (mp4/m3u8)</label>
                                            <input value={episodeFormData.videoUrl} onChange={e => setEpisodeFormData({ ...episodeFormData, videoUrl: e.target.value })} style={inputStyle} required />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Episodio</button>
                                        <button type="button" onClick={() => setIsEditingEpisode(false)} className="btn btn-secondary">Cancelar</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )
            }

            {/* SERVERS MODAL */}
            {
                isServerModalOpen && serverTarget && (
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1600, padding: "20px" }}>
                        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <h2 style={{ fontSize: "1.8rem", fontWeight: "900" }}>Servidores: {serverTarget.title}</h2>
                                <button onClick={() => setIsServerModalOpen(false)} className="btn btn-secondary">Cerrar</button>
                            </div>

                            <form onSubmit={handleServerSubmit} style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "1rem" }}>
                                    {editingServer ? "Editar Servidor" : "Añadir Nuevo Servidor"}
                                </h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "15px", alignItems: "end" }}>
                                    <div>
                                        <label style={labelStyle}>Nombre (Ej. Vidnest)</label>
                                        <input value={serverFormData.name} onChange={e => setServerFormData({ ...serverFormData, name: e.target.value })} style={inputStyle} required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>URL del Video / Embed</label>
                                        <input value={serverFormData.url} onChange={e => setServerFormData({ ...serverFormData, url: e.target.value })} style={inputStyle} required placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Calidad</label>
                                        <select value={serverFormData.quality} onChange={e => setServerFormData({ ...serverFormData, quality: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                                            {QUALITIES.map(q => <option key={q} value={q} style={{ color: "black" }}>{q}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingServer ? "Guardar Cambios" : "+ Añadir Servidor"}
                                    </button>
                                    {editingServer && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingServer(null);
                                                setServerFormData({ name: "", url: "", quality: "HD 1080P" });
                                            }}
                                            className="btn btn-secondary"
                                        >
                                            Cancelar Edición
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {servers.map(srv => (
                                    <div key={srv.id} className="glass-card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                                <div style={{ fontWeight: "800", fontSize: "1.1rem" }}>{srv.name}</div>
                                                <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "800", backgroundColor: "rgba(37,99,235,0.2)", color: "#60a5fa" }}>{srv.quality}</span>
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{srv.url}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={() => {
                                                    setEditingServer(srv);
                                                    setServerFormData({
                                                        name: srv.name,
                                                        url: srv.url,
                                                        quality: srv.quality
                                                    });
                                                }}
                                                style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
                                            >
                                                Editar
                                            </button>
                                            <button onClick={() => deleteServer(srv.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}>Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                                {servers.length === 0 && <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>No hay servidores registrados.</div>}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

const thStyle: React.CSSProperties = {
    padding: "1.5rem 1rem",
    color: "var(--text-secondary)",
    fontSize: "0.8rem",
    fontWeight: "700",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border 0.2s",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
};
