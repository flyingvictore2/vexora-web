import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NAV_KEYS = ["nav.movies","nav.series","nav.animes","nav.list","nav.calendar","nav.requests","nav.support","nav.plans","nav.search"];

export async function GET() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: ["siteName", "allowNewRegistrations", "stripeEnabled", "paypalEnabled", "maintenanceTime", ...NAV_KEYS]
                }
            }
        });

        const settingsObj = settings.reduce((acc: Record<string, unknown>, curr) => {
            if (curr.key === "siteName" || curr.key === "maintenanceTime") {
                acc[curr.key] = curr.value;
            } else {
                acc[curr.key] = curr.value !== "false";
            }
            return acc;
        }, {
            siteName: "Vexora",
            allowNewRegistrations: true,
            stripeEnabled: true,
            paypalEnabled: true,
            maintenanceTime: "30 MINUTOS",
            // Nav sections default to visible
            "nav.movies": true, "nav.series": true, "nav.animes": true,
            "nav.list": true, "nav.calendar": true, "nav.requests": true,
            "nav.support": true, "nav.plans": true, "nav.search": true,
        } as Record<string, unknown>);

        // Build sections object for easy consumption
        const sections: Record<string, boolean> = {};
        for (const k of NAV_KEYS) {
            sections[k.replace("nav.", "")] = settingsObj[k] !== false;
        }
        settingsObj.sections = sections;

        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error("Error fetching public config:", error);
        return NextResponse.json({
            siteName: "Vexora",
            allowNewRegistrations: true,
            stripeEnabled: true,
            paypalEnabled: true,
            maintenanceTime: "30 MINUTOS",
            sections: { movies: true, series: true, animes: true, list: true, calendar: true, requests: true, support: true, plans: true, search: true },
        });
    }
}
