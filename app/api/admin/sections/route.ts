import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/sections — set visibility for a nav section
// Body: { key: "nav.movies", visible: true/false }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, visible } = await req.json();
    if (!key?.startsWith("nav.")) {
        return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    await prisma.setting.upsert({
        where: { key },
        update: { value: visible ? "true" : "false", updatedAt: new Date() },
        create: { key, value: visible ? "true" : "false", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
}
