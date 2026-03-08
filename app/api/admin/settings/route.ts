import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all settings
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const settings = await prisma.setting.findMany();
        // Convert array to object
        const settingsObj = settings.reduce((acc: Record<string, string>, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST/PUT settings
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();

        // Upsert all settings provided in the body
        const promises = Object.entries(body).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value), updatedAt: new Date() }
            });
        });

        await Promise.all(promises);

        return new NextResponse("Settings updated", { status: 200 });
    } catch (error) {
        console.error("Error updating settings:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
