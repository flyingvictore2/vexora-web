import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import MaintenancePage from "./maintenance/page";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Antigra Stream",
    description: "Advanced Streaming Platform",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);
    const [maintenanceModeSetting, maintenanceTimeSetting] = await Promise.all([
        prisma.setting.findUnique({ where: { key: "maintenanceMode" } }),
        prisma.setting.findUnique({ where: { key: "maintenanceTime" } })
    ]);

    const isMaintenance = maintenanceModeSetting?.value === "true";
    const maintenanceTime = maintenanceTimeSetting?.value || "30 MINUTOS";
    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";

    const isAllowedPath = pathname.startsWith("/admin") ||
        pathname.startsWith("/api/admin") ||
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/api/auth");

    if (isMaintenance && !isAdmin && !isAllowedPath && !pathname.includes("/maintenance")) {
        return (
            <html lang="es" suppressHydrationWarning>
                <body className={inter.className}>
                    <Providers>
                        <MaintenancePage time={maintenanceTime} />
                    </Providers>
                </body>
            </html>
        );
    }

    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <Navbar />
                    <main className="page-wrapper">
                        {children}
                    </main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
