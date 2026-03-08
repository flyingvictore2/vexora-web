"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
    plan: string;
    price: string;
}

export default function SubscribeButton({ plan, price }: SubscribeButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, price }),
            });

            if (res.ok) {
                router.push("/account");
            } else {
                const data = await res.json();
                alert(data.error || "Subscription failed");
            }
        } catch (error) {
            console.error("Subscription error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "1rem" }}
            onClick={handleSubscribe}
            disabled={loading}
        >
            {loading ? "Processing..." : "Subscribe"}
        </button>
    );
}
