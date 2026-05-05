"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Row from "@/components/Row";
import Hero from "@/components/Hero";
import axios from "axios";

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
    const [movies, setMovies] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
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
            const [moviesRes, recommendationsRes, historyRes] = await Promise.all([
                axios.get("/api/movies"),
                axios.get(`/api/movies/recommendations?profileId=${profileId}`),
                axios.get(`/api/watchhistory?profileId=${profileId}`),
            ]);
            setMovies(moviesRes.data);
            setRecommendations(recommendationsRes.data);
            setWatchHistory(historyRes.data || []);
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
        <div style={{ paddingBottom: "3rem" }}>
            {/* Hero banner */}
            {heroMovie && <Hero movie={heroMovie} />}

            {movies.length === 0 && !heroMovie && (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '120px 0' }}>
                    <p style={{ fontSize: '18px' }}>No hay contenido disponible por ahora.</p>
                </div>
            )}

            {/* Secciones principales */}
            {/* Si hay historial quitamos el margen negativo para que el título "Seguir viendo" sea visible */}
            <div style={{
                marginTop: heroMovie && continueWatching.length === 0 && watchAgain.length === 0 ? '-4rem' : '1.5rem',
                position: 'relative',
                zIndex: 2,
            }}>
                {continueWatching.length > 0 && (
                    <Row title="▶ Seguir viendo" movies={continueWatching} progressMap={progressMap} />
                )}
                {watchAgain.length > 0 && (
                    <Row title="↩ Volver a ver" movies={watchAgain} progressMap={progressMap} />
                )}

                <Row title="Novedades" movies={novedades} isLargeRow />
                <Row title="Películas" movies={peliculas} />
                <Row title="Series" movies={series} />
                <Row title="Anime" movies={anime} />
                {recommendations.length > 0 && (
                    <Row title="Recomendados para ti" movies={recomendados} />
                )}
            </div>
        </div>
    );
}
