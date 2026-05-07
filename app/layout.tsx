import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PreferencesProvider from "@/components/PreferencesProvider";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import MaintenancePage from "./maintenance/page";
import { ensureMigrations } from "@/lib/migrate";
import { LangProvider } from "@/components/LangProvider";

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
    await ensureMigrations();
    const session = await getServerSession(authOptions);

    const maintenanceSettings = await prisma.setting.findMany({
        where: { key: { in: ["maintenanceTarget", "maintenanceTime", "maintenanceTitle", "maintenanceMessage", "maintenanceEmoji"] } }
    });
    const ms = Object.fromEntries(maintenanceSettings.map(s => [s.key, s.value]));

    // maintenanceTarget: "false" = off | "NON_ADMINS" = users only | "ALL" = everyone
    const maintenanceTarget = ms.maintenanceTarget || "false";
    const maintenanceTime    = ms.maintenanceTime    || "30 MINUTOS";
    const maintenanceTitle   = ms.maintenanceTitle   || "Próximamente";
    const maintenanceMessage = ms.maintenanceMessage || "Estamos trabajando en algo increíble. Vuelve pronto.";
    const maintenanceEmoji   = ms.maintenanceEmoji   || "🚀";

    const isAdmin = (session?.user as any)?.role === "ADMIN";

    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";

    const isAllowedPath = pathname.startsWith("/admin") ||
        pathname.startsWith("/api/admin") ||
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/api/auth");

    const shouldShowMaintenance =
        !isAllowedPath &&
        !pathname.includes("/maintenance") &&
        (maintenanceTarget === "ALL" ||
         (maintenanceTarget === "NON_ADMINS" && !isAdmin));

    if (shouldShowMaintenance) {
        return (
            <html lang="es" suppressHydrationWarning>
                <body className={inter.className}>
                    <Providers>
                        <MaintenancePage
                            time={maintenanceTime}
                            title={maintenanceTitle}
                            message={maintenanceMessage}
                            emoji={maintenanceEmoji}
                        />
                    </Providers>
                </body>
            </html>
        );
    }

    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <LangProvider>
                        <PreferencesProvider>
                            <Navbar />
                            <main className="page-wrapper">
                                {children}
                            </main>
                            <Footer />
                        </PreferencesProvider>
                    </LangProvider>
                </Providers>
            </body>
        </html>
    );
}
