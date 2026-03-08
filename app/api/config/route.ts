import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: ["siteName", "allowNewRegistrations", "stripeEnabled", "paypalEnabled", "maintenanceTime"]
                }
            }
        });

        const settingsObj = settings.reduce((acc: Record<string, any>, curr: any) => {
            if (curr.key === "siteName" || curr.key === "maintenanceTime") {
                acc[curr.key] = curr.value;
            } else {
                acc[curr.key] = curr.value !== "false";
            }
            return acc;
        }, {
            siteName: "Series.ly",
            allowNewRegistrations: true,
            stripeEnabled: true,
            paypalEnabled: true,
            maintenanceTime: "30 MINUTOS"
        } as Record<string, any>);

        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error("Error fetching public config:", error);
        return NextResponse.json({
            siteName: "Series.ly",
            allowNewRegistrations: true,
            stripeEnabled: true,
            paypalEnabled: true,
            maintenanceTime: "30 MINUTOS"
        });
    }
}
