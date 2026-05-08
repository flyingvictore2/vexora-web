import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV_SECTIONS = [
    "movies","series","animes","list","calendar",
    "requests","support","plans","search","social",
    "achievements",
];

function resolveSection(raw: string | undefined, isAdmin: boolean): "visible" | "soon" | "hidden" {
    if (!raw || raw === "visible" || raw === "true") return "visible";
    if (raw === "soon_all") return "soon";
    if (raw === "soon_non_admins") return isAdmin ? "visible" : "soon";
    if (raw === "hidden_all") return "hidden";
    if (raw === "hidden_non_admins") return isAdmin ? "visible" : "hidden";
    if (raw === "false") return "hidden"; // legacy boolean support
    return "visible";
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        const keys = [
            "siteName","allowNewRegistrations","stripeEnabled","paypalEnabled","maintenanceTime",
            ...NAV_SECTIONS.map(k => `nav.${k}`),
        ];
        const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
        const raw = Object.fromEntries(settings.map(s => [s.key, s.value]));

        const sections: Record<string, "visible" | "soon" | "hidden"> = {};
        for (const k of NAV_SECTIONS) {
            sections[k] = resolveSection(raw[`nav.${k}`], isAdmin);
        }

        return NextResponse.json({
            siteName: raw.siteName || "Vexora",
            allowNewRegistrations: raw.allowNewRegistrations !== "false",
            stripeEnabled: raw.stripeEnabled !== "false",
            paypalEnabled: raw.paypalEnabled !== "false",
            maintenanceTime: raw.maintenanceTime || "30 MINUTOS",
            sections,
        });
    } catch (error) {
        console.error("Error fetching public config:", error);
        return NextResponse.json({
            siteName: "Vexora",
            sections: Object.fromEntries(NAV_SECTIONS.map(k => [k, "visible" as const])),
        });
    }
}
