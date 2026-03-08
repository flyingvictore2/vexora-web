"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const planDetails: Record<string, { name: string; price: string; color: string }> = {
    BRONCE: { name: "Bronce", price: "4.99", color: "#cd7f32" },
    PLATA: { name: "Plata", price: "9.99", color: "#c0c0c0" },
    ORO: { name: "Oro", price: "14.99", color: "#fbbf24" }
};

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("card");
    const [paymentSettings, setPaymentSettings] = useState({ stripeEnabled: true, paypalEnabled: true });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [paypalLoaded, setPaypalLoaded] = useState(false);

    const planId = params.planId as string;
    const plan = planDetails[planId];

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get("/api/config");
                setPaymentSettings(res.data);
            } catch (error) {
                console.error("Failed to fetch payment settings", error);
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (settingsLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0c10', color: 'white' }}>Cargando pasarela de pagos...</div>;
    }

    if (!plan) {
        return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Plan no encontrado.</div>;
    }

    if (!paymentSettings.stripeEnabled && !paymentSettings.paypalEnabled) {
        return (
            <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: "20px" }}>Pagos desactivados temporalmente</h2>
                <p style={{ color: "#94a3b8" }}>Estamos realizando tareas de mantenimiento en las pasarelas de pago. Por favor, vuelve a intentarlo más tarde o contacta con soporte.</p>
                <Link href="/plans" style={{ display: "inline-block", marginTop: "30px", padding: "12px 24px", backgroundColor: "var(--primary)", color: "white", textDecoration: "none", borderRadius: "10px", fontWeight: "800" }}>Volver a Planes</Link>
            </div>
        );
    }

    const handleStripePayment = async () => {
        setLoading(true);
        try {
            const response = await axios.post("/api/create-checkout-session", {
                planId: planId,
                price: plan.price,
                planName: plan.name
            });

            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error("Stripe session error", error);
            alert("Error al conectar con Stripe. Revisa tus claves en el archivo .env");
        } finally {
            setLoading(false);
        }
    };

    const handlePayPalSuccess = async (details: any) => {
        try {
            // After PayPal payment is successful, update the internal database
            await axios.post("/api/subscribe", { plan: planId });
            await update();
            router.push("/");
        } catch (error) {
            console.error("PayPal update error", error);
            alert("Pago completado en PayPal pero hubo un error al actualizar tu perfil. Contacta con soporte.");
        }
    };


    return (
        <PayPalScriptProvider options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
            currency: "EUR",
            intent: "capture",
            "data-sdk-integration-source": "react-paypal-js"
        }}>
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{
                    backgroundColor: '#111827',
                    width: '100%',
                    maxWidth: '900px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Left Side: Summary */}
                    <div style={{ padding: '40px', backgroundColor: '#1f2937' }}>
                        <Link href="/plans" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '30px' }}>
                            ← Volver a planes
                        </Link>
                        <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', marginBottom: '40px' }}>Resumen del pedido</h1>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ color: '#94a3b8' }}>Plan seleccionado</span>
                            <span style={{ color: plan.color, fontWeight: '800' }}>Plan {plan.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <span style={{ color: '#94a3b8' }}>Suscripción</span>
                            <span style={{ color: 'white' }}>Mensual</span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>Total</span>
                            <span style={{ color: 'white', fontSize: '2rem', fontWeight: '900' }}>{plan.price}€</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '10px' }}>* IVA incluido. Pago seguro 100% real.</p>
                    </div>

                    {/* Right Side: Real Payment Integration */}
                    <div style={{ padding: '40px', backgroundColor: '#111827' }}>
                        <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '700', marginBottom: '25px', textAlign: 'center' }}>Pagar Suscripción</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Card Option via Stripe */}
                            {paymentSettings.stripeEnabled && (
                                <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '15px' }}>Tarjeta de Crédito / Débito</h3>
                                    <button
                                        onClick={handleStripePayment}
                                        disabled={loading}
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '1rem',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        {loading ? 'CONECTANDO...' : `PAGAR ${plan.price}€`}
                                    </button>
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', opacity: 0.6 }}>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/fb/Visa_logo_2014.svg" alt="Visa" style={{ height: '12px' }} />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style={{ height: '15px' }} />
                                    </div>
                                </div>
                            )}

                            {paymentSettings.stripeEnabled && paymentSettings.paypalEnabled && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563', margin: '10px 0' }}>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1f2937' }} />
                                    <span style={{ fontSize: '12px' }}>O TAMBIÉN</span>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1f2937' }} />
                                </div>
                            )}

                            {/* PayPal Option */}
                            {paymentSettings.paypalEnabled && (
                                <div style={{ minHeight: '150px', position: 'relative', zIndex: 10 }}>
                                    {!paypalLoaded && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', zIndex: 11, borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Conectando con plataforma de pagos...</div>
                                            <div style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                        </div>
                                    )}
                                    <div id="paypal-button-container" style={{ width: '100%' }}>
                                        <PayPalButtons
                                            key={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "loading"}
                                            style={{ layout: "vertical", color: "blue", shape: "rect", label: "subscribe" }}
                                            onInit={() => setPaypalLoaded(true)}
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    intent: "CAPTURE",
                                                    purchase_units: [{
                                                        description: `Suscripción Premium Series.ly: ${plan.name}`,
                                                        amount: { currency_code: "EUR", value: plan.price },
                                                    }],
                                                });
                                            }}
                                            onApprove={async (data, actions) => {
                                                const details = await actions.order?.capture();
                                                handlePayPalSuccess(details);
                                            }}
                                            onError={(err) => {
                                                console.error("PayPal Interaction Error:", err);
                                                const errorMsg = document.getElementById("paypal-error");
                                                if (errorMsg) {
                                                    errorMsg.style.display = "block";
                                                }
                                                setPaypalLoaded(true);
                                            }}
                                        />
                                    </div>
                                    <div id="paypal-error" style={{ display: 'none', color: 'var(--error)', fontSize: '12px', textAlign: 'center', marginTop: '15px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                        Error al cargar PayPal. Por favor, desactiva bloqueadores de publicidad o intenta con tarjeta.
                                    </div>
                                </div>
                            )}
                        </div>

                        <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '11px', marginTop: '30px' }}>
                            Pago 100% seguro procesado por Stripe y PayPal. Tus datos están cifrados.
                        </p>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}
