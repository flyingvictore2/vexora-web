import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import React from "react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    // Verificación server-side: si no es ADMIN, redirigir
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0b0c10" }}>
            <AdminSidebar />
            <main style={{
                flex: 1,
                marginLeft: "280px",
                padding: "60px 50px",
                backgroundColor: "#0b0c10",
                minHeight: "100vh"
            }}>
                {children}
            </main>
        </div>
    );
}
