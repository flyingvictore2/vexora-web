"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Row from "@/components/Row";
import Hero from "@/components/Hero";
import axios from "axios";
import { useT } from "@/components/LangProvider";

interface WatchHistoryItem {
    id: string;
    movieId: string;
    progress: number;
    title: string;
    thumbnailUrl: string;
    type: string;
    genre: string;
    rating: string;
    year: number;
    requiredPlan: string;
    description: string;
    videoUrl: string;
    duration: string;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useT();
    const [movies, setMovies] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
    const [nextEpisodes, setNextEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated") {
            const profileId = localStorage.getItem("selectedProfileId");
            if (!profileId) {
                router.push("/profiles");
            } else {
                fetchContent(profileId);
            }
        }
    }, [status, router]);

    const fetchContent = async (profileId: string) => {
        try {
            const [moviesRes, recommendationsRes, historyRes, nextRes, hiddenRes] = await Promise.all([
                axios.get("/api/movies"),
                axios.get(`/api/movies/recommendations?profileId=${profileId}`),
                axios.get(`/api/watchhistory?profileId=${profileId}`),
                axios.get(`/api/next-episode?profileId=${profileId}`),
                axios.get(`/api/hidden?profileId=${profileId}`),
            ]);
            const hiddenSet = new Set<string>(Array.isArray(hiddenRes.data) ? hiddenRes.data : []);
            const filterHidden = (arr: any[]) => arr.filter(m => !hiddenSet.has(m.id));
            setMovies(filterHidden(moviesRes.data));
            setRecommendations(filterHidden(recommendationsRes.data));
            setWatchHistory(historyRes.data || []);
            setNextEpisodes(nextRes.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh cada 30 segundos
    useEffect(() => {
        if (status !== "authenticated") return;
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) return;
        const interval = setInterval(() => fetchContent(profileId), 30000);
        return () => clearInterval(interval);
    }, [status]);

    if (status === "loading" || loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b0c10',
                color: 'white'
            }}>
                <p>Cargando...</p>
            </div>
        );
    }

    const heroMovie = recommendations[0] || movies[0] || null;
    const novedades = [...movies].reverse().slice(0, 18);
    const peliculas = movies.filter(m => m.type === "MOVIE").slice(0, 18);
    const series = movies.filter(m => m.type === "SERIE").slice(0, 18);
    const anime = movies.filter(m => m.type === "ANIME").slice(0, 18);
    const recomendados = (recommendations.length > 0 ? recommendations : movies).slice(0, 18);

    // Watch history rows
    const continueWatching = watchHistory
        .filter(h => h.progress > 0 && h.progress < 95)
        .slice(0, 18);
    const watchAgain = watchHistory
        .filter(h => h.progress >= 95)
        .slice(0, 18);

    // Progress map for the Row component (movieId -> progress%)
    const progressMap: Record<string, number> = {};
    watchHistory.forEach(h => { progressMap[h.id || h.movieId] = h.progress; });

    return (
        <div style={{ paddingBottom: "4rem" }}>
            {/* Hero banner */}
            {heroMovie && <Hero movie={heroMovie} />}

            {movies.length === 0 && !heroMovie && (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '120px 0' }}>
                    <p style={{ fontSize: '18px' }}>No hay contenido disponible por ahora.</p>
                </div>
            )}

            {/* Rows — always below hero, never overlapping titles */}
            <div style={{ position: 'relative', zIndex: 2, paddingTop: heroMovie ? '1.5rem' : '0' }}>

                {/* Tu próximo episodio */}
                {nextEpisodes.length > 0 && (
                    <div style={{ padding: "0 4%", marginBottom: "2.5rem" }}>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.75rem", color: "var(--foreground)" }}>
                            {t("home.nextep")}
                        </h2>
                        <div style={{ display: "flex", gap: "10px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
                            {nextEpisodes.map((ne: any) => (
                                <a key={ne.episode.id} href={`/watch/episode/${ne.episode.id}`} style={{
                                    flex: "0 0 auto", width: "300px",
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: "10px", overflow: "hidden", textDecoration: "none", color: "white",
                                    transition: "transform 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                    <div style={{ width: "100%", aspectRatio: "16/9", background: "#1e293b", overflow: "hidden", position: "relative" }}>
                                        {(ne.episode.thumbnailUrl || ne.seriesThumbnail) && (
                                            <img src={ne.episode.thumbnailUrl || ne.seriesThumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        )}
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%)" }} />
                                        <div style={{ position: "absolute", top: "8px", left: "8px", padding: "3px 8px", background: "rgba(99,102,241,0.85)", color: "white", fontSize: "0.65rem", fontWeight: "800", borderRadius: "4px", letterSpacing: "0.5px" }}>
                                            S{ne.episode.seasonNumber}·E{ne.episode.episodeNumber}
                                        </div>
                                    </div>
                                    <div style={{ padding: "10px 14px" }}>
                                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {ne.seriesTitle}
                                        </div>
                                        <div style={{ fontSize: "0.88rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {ne.episode.title}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {continueWatching.length > 0 && (
                    <Row title={t("home.continue")} movies={continueWatching} progressMap={progressMap} />
                )}

                <Row title={t("home.news")} movies={novedades} isLargeRow />
                {peliculas.length > 0 && <Row title={t("home.movies")} movies={peliculas} />}
                {series.length > 0 && <Row title={t("home.series")} movies={series} />}
                {anime.length > 0 && <Row title={t("home.anime")} movies={anime} />}
                {recommendations.length > 0 && (
                    <Row title={t("home.recommended")} movies={recomendados} />
                )}

                {/* "Volver a ver" siempre al final */}
                {watchAgain.length > 0 && (
                    <Row title={t("home.watchagain")} movies={watchAgain} progressMap={progressMap} />
                )}
            </div>
        </div>
    );
}
