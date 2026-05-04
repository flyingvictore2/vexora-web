import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — obtener datos del usuario actual
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            subscription: true,
            invoice: { orderBy: { date: "desc" } },
        },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        subscription: user.subscription,
        invoices: user.invoice.map(inv => ({
            id: inv.id,
            date: inv.date,
            amount: inv.amount,
            currency: inv.currency,
            plan: inv.plan,
            status: inv.status,
        })),
    });
}

// PATCH — actualizar nombre o email
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    if (!name && !email) {
        return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    // Si cambia el email, verificar que no esté en uso
    if (email && email !== session.user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 409 });
        }
    }

    const updated = await prisma.user.update({
        where: { email: session.user.email },
        data: {
            ...(name !== undefined && { name }),
            ...(email && { email }),
        },
    });

    return NextResponse.json({ success: true, name: updated.name, email: updated.email });
}
