"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface AddToListButtonProps {
    movieId: string;
    minimal?: boolean;
}

export default function AddToListButton({ movieId, minimal }: AddToListButtonProps) {
    const [isAdded, setIsAdded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileId, setProfileId] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem("selectedProfileId");
        setProfileId(id);

        if (id) {
            checkIfAdded(id);
        } else {
            setLoading(false);
        }
    }, [movieId]);

    const checkIfAdded = async (pId: string) => {
        try {
            const res = await axios.get(`/api/mylist?profileId=${pId}`);
            const list = res.data;
            setIsAdded(list.some((m: any) => m.id === movieId));
        } catch (error) {
            console.error("Failed to check if added", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMyList = async () => {
        if (!profileId) {
            alert("¡Por favor, selecciona un perfil primero!");
            return;
        }

        setLoading(true);
        try {
            if (isAdded) {
                await axios.delete(`/api/mylist?movieId=${movieId}&profileId=${profileId}`);
                setIsAdded(false);
            } else {
                await axios.post("/api/mylist", { movieId, profileId });
                setIsAdded(true);
            }
        } catch (error) {
            console.error("Failed to toggle My List", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        if (minimal) return <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>...</div>;
        return <button className="btn btn-secondary" style={{ fontSize: "1.1rem", padding: "0.8rem 2.5rem", opacity: 0.5 }} disabled>...</button>;
    }

    if (minimal) {
        return (
            <button
                onClick={toggleMyList}
                title={isAdded ? "Quitar de mi lista" : "Añadir a mi lista"}
                style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    border: isAdded ? "2px solid #2563eb" : "2px solid rgba(255,255,255,0.3)",
                    backgroundColor: isAdded ? "rgba(37, 99, 235, 0.2)" : "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
                {isAdded ? "✓" : "+"}
            </button>
        );
    }

    return (
        <button
            className="btn btn-secondary"
            style={{ fontSize: "1.1rem", padding: "0.8rem 2.5rem", border: isAdded ? "1px solid #2563eb" : "" }}
            onClick={toggleMyList}
        >
            {isAdded ? "✓ En mi lista" : "+ Mi lista"}
        </button>
    );
}
