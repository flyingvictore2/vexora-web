import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Si el usuario tiene contraseña (registro por email), verificar la actual
    if (user.password) {
        if (!currentPassword) {
            return NextResponse.json({ error: "Introduce tu contraseña actual" }, { status: 400 });
        }
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 403 });
        }
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { email: session.user.email },
        data: { password: hashed },
    });

    return NextResponse.json({ success: true });
}
