"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Row from "@/components/Row";
import CategoryTabs from "@/components/CategoryTabs";
import axios from "axios";

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [movies, setMovies] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
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
            const [moviesRes, recommendationsRes] = await Promise.all([
                axios.get("/api/movies"),
                axios.get(`/api/movies/recommendations?profileId=${profileId}`)
            ]);
            setMovies(moviesRes.data);
            setRecommendations(recommendationsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh: poll for new content every 30 seconds
    useEffect(() => {
        if (status !== "authenticated") return;
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) return;

        fetchContent(profileId);
        const interval = setInterval(() => fetchContent(profileId), 30000);
        return () => clearInterval(interval);
    }, [status]);

    if (status === "loading" || loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0c10', color: 'white' }}>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <CategoryTabs />
            {(movies.length > 0 || recommendations.length > 0) ? (
                <>
                    <Row
                        title="Recomendados para ti"
                        movies={recommendations.length > 0 ? recommendations : movies}
                        isLargeRow
                    />
                    <Row title="Películas en Tendencia" movies={movies.filter(m => m.type === "MOVIE").slice(0, 10)} />
                    <Row title="Series más Vistas" movies={movies.filter(m => m.type === "SERIE").slice(0, 10)} />
                    <Row title="Animes Imprescindibles" movies={movies.filter(m => m.type === "ANIME").slice(0, 10)} />
                    <Row title="Añadido Recientemente" movies={[...movies].reverse().slice(0, 10)} />
                </>
            ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '100px 0' }}>
                    <p style={{ fontSize: '18px' }}>No hay contenido disponible por ahora.</p>
                </div>
            )}
        </div>
    );
}
