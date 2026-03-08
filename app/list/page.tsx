"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Row, { Movie } from "@/components/Row";

export default function MyListPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profileId = localStorage.getItem("selectedProfileId");
        if (!profileId) {
            setLoading(false);
            return;
        }

        const fetchMyList = async () => {
            try {
                const res = await axios.get(`/api/mylist?profileId=${profileId}`);
                setMovies(res.data);
            } catch (error) {
                console.error("Failed to fetch my list", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyList();
    }, []);

    if (loading) {
        return <div style={{ color: "white", padding: "100px", textAlign: "center" }}>Cargando tu lista...</div>;
    }

    return (
        <div style={{ paddingBottom: "2rem" }}>
            {movies.length === 0 ? (
                <div style={{ padding: "50px 0", textAlign: "center", color: "#94a3b8" }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Tu lista está vacía</h2>
                    <p>Añade películas y series para tenerlas a mano.</p>
                </div>
            ) : (
                <Row title="Mi Lista" movies={movies} isLargeRow />
            )}
        </div>
    );
}
