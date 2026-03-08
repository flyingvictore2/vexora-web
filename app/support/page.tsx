"use client";

import React, { useState } from "react";
import axios from "axios";

export default function SupportPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            await axios.post("/api/support", formData);
            setStatus({ msg: "¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.", ok: true });
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            setStatus({ msg: "Error al enviar el mensaje. Por favor, inténtalo de nuevo.", ok: false });
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ paddingBottom: "5rem" }}>

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
                <header style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <h1 style={{ fontSize: "3rem", fontWeight: "900", color: "white", marginBottom: "1rem" }}>Centro de Ayuda</h1>
                    <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>¿Tienes alguna duda o problema? Estamos aquí para ayudarte.</p>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
                    {/* FAQ Column */}
                    <div>
                        <h2 style={{ color: "white", fontSize: "1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span>❓</span> Preguntas Frecuentes
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {[
                                { q: "¿Cómo puedo ver contenido en 4K?", a: "Para ver contenido en 4K necesitas una conexión de al menos 25Mbps y un dispositivo compatible." },
                                { q: "¿Puedo compartir mi cuenta?", a: "Sí, dependiendo de tu plan puedes tener de 1 a 4 perfiles simultáneos." },
                                { q: "¿Cómo cancelo mi suscripción?", a: "Ve a Ajustes > Cuenta > Suscripción y haz clic en cancelar." },
                                { q: "¿Qué métodos de pago aceptáis?", a: "Aceptamos tarjetas de crédito, débito, PayPal y Stripe." }
                            ].map((item, i) => (
                                <div key={i} className="glass-card" style={{ padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <h3 style={{ color: "var(--primary)", fontSize: "1rem", marginBottom: "0.5rem", fontWeight: "700" }}>{item.q}</h3>
                                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.6" }}>{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form Column */}
                    <div>
                        <h2 style={{ color: "white", fontSize: "1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <span>✉️</span> Envíanos un mensaje
                        </h2>

                        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "2.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {status && (
                                <div style={{
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    marginBottom: "1.5rem",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    backgroundColor: status.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                    border: `1px solid ${status.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                                    color: status.ok ? "#10b981" : "#ef4444"
                                }}>
                                    {status.msg}
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div>
                                    <label style={labelStyle}>Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Juan Pérez"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="tu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Asunto</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="¿En qué podemos ayudarte?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Mensaje</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Describe tu consulta aquí..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        style={{ ...inputStyle, resize: "none" }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="btn btn-primary"
                                    style={{ padding: "1rem", fontWeight: "800", fontSize: "1rem" }}
                                >
                                    {sending ? "ENVIANDO..." : "ENVIAR CONSULTA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.85rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.8rem 1rem",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    transition: "border 0.2s",
};
