"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Personalización fue integrada en /account — redirigir automáticamente
export default function SettingsRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/account?tab=personalizacion"); }, [router]);
    return null;
}
