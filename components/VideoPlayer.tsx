"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./VideoPlayer.module.css";
import Link from "next/link";

import { useRouter } from "next/navigation";

interface VideoPlayerProps {
    src: string;
    title: string;
    onProgressUpdate?: (progress: number) => void;
}

export default function VideoPlayer({ src, title, onProgressUpdate }: VideoPlayerProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [activeModal, setActiveModal] = useState<"none" | "audio" | "quality">("none");
    const [toast, setToast] = useState("");
    const controlsTimeoutRef = useRef<any>(null);
    const lastSavedTimeRef = useRef<number>(0);

    // Detect if the src is an embed (iframe)
    const isEmbed = src.includes("http") && (
        src.includes("/e/") ||
        src.includes("embed") ||
        src.includes("voe.sx") ||
        src.includes("ok.ru") ||
        src.includes("youtube.com") ||
        !src.match(/\.(mp4|m3u8|webm|mkv|mov|avi)$/)
    );

    const togglePlay = () => {
        if (isEmbed) return;
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setPlaying(!playing);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            if (!duration || isNaN(duration)) return;
            const pct = (current / duration) * 100;
            setProgress(pct);

            if (current > 5 && current < 90) {
                setShowSkipIntro(true);
            } else {
                setShowSkipIntro(false);
            }

            // Report progress to parent every 15 seconds of playback
            if (onProgressUpdate && current - lastSavedTimeRef.current >= 15) {
                lastSavedTimeRef.current = current;
                onProgressUpdate(Math.round(pct));
            }
        }
    };

    const handlePause = () => {
        if (videoRef.current && onProgressUpdate) {
            const dur = videoRef.current.duration;
            if (dur && !isNaN(dur)) {
                onProgressUpdate(Math.round((videoRef.current.currentTime / dur) * 100));
            }
        }
    };

    const handleEnded = () => {
        if (onProgressUpdate) onProgressUpdate(100);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isEmbed) return;
        const val = Number(e.target.value);
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            videoRef.current.currentTime = (val / 100) * duration;
            setProgress(val);
        }
    };

    const skipIntro = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 90;
            setShowSkipIntro(false);
        }
    };

    const togglePiP = async () => {
        if (videoRef.current) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await videoRef.current.requestPictureInPicture();
                }
            } catch (error) {
                console.error("PiP failed", error);
            }
        }
    };

    const copyWatchPartyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setToast("¡Enlace de Watch Party copiado!");
            setTimeout(() => setToast(""), 3000);
        });
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (playing && activeModal === "none") setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    return (
        <div className={styles.container} onMouseMove={handleMouseMove}>
            {isEmbed ? (
                <iframe
                    src={src}
                    className={styles.video}
                    style={{ border: "none" }}
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                />
            ) : (
                <video
                    ref={videoRef}
                    className={styles.video}
                    src={src}
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    autoPlay
                />
            )}

            {toast && <div className={styles.toast}>{toast}</div>}

            {/* Overlay UI */}
            <div className={`${styles.overlay} ${showControls ? styles.show : styles.hide}`}>
                <div className={styles.topBar}>
                    <button onClick={() => router.back()} className={styles.backBtn} style={{ background: "none", border: "none", cursor: "pointer" }}>← Volver</button>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.shareBtn} onClick={copyWatchPartyLink} title="Watch Party">
                        👥 Invitar a ver
                    </button>
                </div>

                {!isEmbed && (
                    <>
                        {showSkipIntro && (
                            <button className={styles.skipBtn} onClick={skipIntro}>
                                Saltar Intro
                            </button>
                        )}

                        {activeModal === "audio" && (
                            <div className={styles.modal}>
                                <h3>Audio y Subtítulos</h3>
                                <div className={styles.modalGrid}>
                                    <div>
                                        <h4>Audio</h4>
                                        <ul>
                                            <li className={styles.active}>Español (España)</li>
                                            <li>Inglés (Original)</li>
                                            <li>Francés</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4>Subtítulos</h4>
                                        <ul>
                                            <li>Desactivados</li>
                                            <li className={styles.active}>Español</li>
                                            <li>Inglés</li>
                                        </ul>
                                    </div>
                                </div>
                                <button onClick={() => setActiveModal("none")} className={styles.closeBtn}>Cerrar</button>
                            </div>
                        )}

                        {activeModal === "quality" && (
                            <div className={styles.modal}>
                                <h3>Calidad de Vídeo</h3>
                                <ul>
                                    <li>4K (Ultra HD)</li>
                                    <li className={styles.active}>1080p (Full HD)</li>
                                    <li>720p (HD)</li>
                                    <li>Automático</li>
                                </ul>
                                <button onClick={() => setActiveModal("none")} className={styles.closeBtn}>Cerrar</button>
                            </div>
                        )}

                        <div className={styles.controls}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className={styles.seekBar}
                            />

                            <div className={styles.buttonsRow}>
                                <div className={styles.leftControls}>
                                    <button onClick={togglePlay} className={styles.playBtn}>
                                        {playing ? "❚❚" : "▶"}
                                    </button>
                                    <button className={styles.controlBtn}>Volumen</button>
                                </div>

                                <div className={styles.rightControls}>
                                    <button className={styles.controlBtn} onClick={() => setActiveModal("audio")}>
                                        Audio y Subtítulos
                                    </button>
                                    <button className={styles.controlBtn} onClick={() => setActiveModal("quality")}>
                                        Calidad: HD
                                    </button>
                                    <button className={styles.controlBtn} onClick={togglePiP}>PiP</button>
                                    <button className={styles.controlBtn}>Siguiente</button>
                                    <button className={styles.controlBtn}>Pantalla Completa</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
