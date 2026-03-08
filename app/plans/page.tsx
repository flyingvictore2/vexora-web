"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

const plans = [
    {
        id: "FREE",
        name: "GRATIS",
        price: "0",
        features: ["Calidad SD (480p)", "1 dispositivo", "Con anuncios", "Catálogo limitado"],
        color: "#94a3b8"
    },
    {
        id: "BRONCE",
        name: "BRONCE",
        price: "4.99",
        features: ["Calidad HD (720p)", "2 dispositivos", "Sin anuncios", "Todo el catálogo"],
        color: "#cd7f32"
    },
    {
        id: "PLATA",
        name: "PLATA",
        price: "9.99",
        features: ["Calidad Full HD (1080p)", "4 dispositivos", "Sin anuncios", "Descargas offline"],
        color: "#c0c0c0",
        popular: true
    },
    {
        id: "ORO",
        name: "ORO",
        price: "14.99",
        features: ["Calidad 4K + HDR", "6 dispositivos", "Sonido Dolby Atmos", "Acceso anticipado"],
        color: "#fbbf24"
    }
];

export default function PlansPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        if (planId !== 'FREE') {
            router.push(`/checkout/${planId}`);
            return;
        }

        setLoading(planId);
        try {
            await axios.post("/api/subscribe", { plan: planId });
            await update();
            router.push("/");
        } catch (error) {
            console.error("Subscription failed", error);
            alert("Error al procesar la suscripción. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '15px' }}>Elige tu Plan</h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Disfruta de Series.ly como tú quieras. Sin compromisos.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                alignItems: 'stretch'
            }}>
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        style={{
                            backgroundColor: '#111827',
                            borderRadius: '20px',
                            padding: '40px 30px',
                            display: 'flex',
                            flexDirection: 'column',
                            border: plan.popular ? `2px solid #2563eb` : '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            transition: 'transform 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {plan.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#2563eb',
                                padding: '4px 16px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '800',
                                letterSpacing: '1px'
                            }}>
                                MÁS POPULAR
                            </div>
                        )}

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: plan.color, marginBottom: '10px', textAlign: 'center' }}>
                            {plan.name}
                        </h2>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>{plan.price}€</span>
                            <span style={{ color: '#94a3b8' }}>/mes</span>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
                            {plan.features.map((feature, idx) => (
                                <li key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '15px',
                                    fontSize: '14px',
                                    color: '#cbd5e1'
                                }}>
                                    <span style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</span> {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={loading !== null}
                            className={`btn ${plan.id === 'ORO' || plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                width: '100%',
                                padding: '15px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '800',
                                opacity: loading === plan.id ? 0.7 : 1
                            }}
                        >
                            {loading === plan.id ? 'PROCESANDO...' : `SELECCIONAR ${plan.name}`}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '60px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                <p>* Puedes cambiar de plan o cancelar tu suscripción en cualquier momento.</p>
                <p>Todos los precios incluyen IVA.</p>
            </div>
        </div>
    );
}
