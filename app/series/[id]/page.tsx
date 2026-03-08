import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login");
    }

    const series = await prisma.movie.findUnique({
        where: { id },
        include: {
            episodes: {
                orderBy: [
                    { seasonNumber: "asc" },
                    { episodeNumber: "asc" }
                ]
            }
        }
    });

    if (!series || series.type !== "SERIE") {
        notFound();
    }

    // Group episodes by season
    const seasons = series.episodes.reduce((acc: any, ep) => {
        if (!acc[ep.seasonNumber]) acc[ep.seasonNumber] = [];
        acc[ep.seasonNumber].push(ep);
        return acc;
    }, {});

    return (
        <div style={{ color: "white", minHeight: "100vh", backgroundColor: "#060606" }}>
            {/* Hero / Header Section */}
            <div style={{ position: "relative", height: "70vh", width: "100%" }}>
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `linear-gradient(to top, #060606, transparent), url(${series.thumbnailUrl})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.6
                }} />

                <div style={{ position: "relative", zIndex: 10, padding: "10% 4%", maxWidth: "800px" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "4px", fontSize: "0.8rem" }}>{series.genre}</span>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "4px", fontSize: "0.8rem" }}>{series.year}</span>
                        <span style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "4px", fontSize: "0.8rem" }}>{series.rating}</span>
                    </div>
                    <h1 style={{ fontSize: "4rem", fontWeight: "900", marginBottom: "1.5rem" }}>{series.title}</h1>
                    <p style={{ fontSize: "1.1rem", lineHeight: "1.6", opacity: 0.8, marginBottom: "2rem" }}>{series.description}</p>

                    <div style={{ display: "flex", gap: "15px" }}>
                        {series.episodes.length > 0 && (
                            <Link href={`/watch/episode/${series.episodes[0].id}`} className="btn btn-primary" style={{ padding: "12px 30px", fontSize: "1.1rem" }}>
                                Reproducir S1:E1
                            </Link>
                        )}
                        <AddToListButton movieId={series.id} minimal={true} />
                    </div>
                </div>
            </div>

            {/* Episodes List Section */}
            <div style={{ padding: "0 4%", marginTop: "-50px", position: "relative", zIndex: 20 }}>
                <div style={{ display: "flex", gap: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "2rem" }}>
                    <button style={{ border: "none", background: "none", color: "white", padding: "15px 0", fontSize: "1.1rem", fontWeight: "700", borderBottom: "3px solid var(--primary)" }}>EPISODIOS</button>
                    <button style={{ border: "none", background: "none", color: "var(--text-secondary)", padding: "15px 0", fontSize: "1.1rem", fontWeight: "700" }}>DETALLES</button>
                    <button style={{ border: "none", background: "none", color: "var(--text-secondary)", padding: "15px 0", fontSize: "1.1rem", fontWeight: "700" }}>SIMILARES</button>
                </div>

                {Object.keys(seasons).map(seasonNum => (
                    <div key={seasonNum} style={{ marginBottom: "3rem" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem", opacity: 0.6 }}>Temporada {seasonNum}</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {seasons[seasonNum].map((ep: any) => (
                                <Link key={ep.id} href={`/watch/episode/${ep.id}`} style={{
                                    display: "flex", gap: "20px", padding: "15px", borderRadius: "12px",
                                    backgroundColor: "rgba(255,255,255,0.03)", transition: "all 0.2s",
                                    textDecoration: "none", color: "inherit"
                                }} className="episode-row">
                                    <div style={{ position: "relative", width: "160px", height: "90px", flexShrink: 0 }}>
                                        <img src={ep.thumbnailUrl} alt={ep.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }} className="play-overlay">
                                            ▶️
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>{ep.episodeNumber}. {ep.title}</h3>
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {ep.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .episode-row:hover {
                    background-color: rgba(255,255,255,0.08) !important;
                    transform: translateX(10px);
                }
                .episode-row:hover .play-overlay {
                    opacity: 1 !important;
                    background-color: rgba(0,0,0,0.4);
                }
            `}} />
        </div>
    );
}
