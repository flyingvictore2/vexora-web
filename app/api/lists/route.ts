import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lists?profileId=xxx — obtener todas las listas del perfil
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

    const lists = await prisma.userList.findMany({
        where: { profileId },
        include: {
            items: {
                include: { movie: true },
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(lists);
}

// POST /api/lists — crear una lista nueva
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profileId, name } = await req.json();
    if (!profileId || !name?.trim()) return NextResponse.json({ error: "profileId y name requeridos" }, { status: 400 });

    const list = await prisma.userList.create({
        data: { id: crypto.randomUUID(), name: name.trim(), profileId },
    });

    return NextResponse.json(list);
}
