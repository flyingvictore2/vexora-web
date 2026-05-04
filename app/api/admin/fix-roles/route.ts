import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Endpoint de emergencia: pone a USER todos los que no son el superadmin
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const SUPER_ADMIN_EMAIL = "flyingvictor2006@gmail.com";

    // Resetea todos a USER excepto el superadmin
    const result = await prisma.user.updateMany({
        where: {
            email: { not: SUPER_ADMIN_EMAIL }
        },
        data: { role: "USER" }
    });

    // Asegura que el superadmin sea ADMIN
    await prisma.user.updateMany({
        where: { email: SUPER_ADMIN_EMAIL },
        data: { role: "ADMIN" }
    });

    return NextResponse.json({
        success: true,
        usersResetToUser: result.count,
        message: `${result.count} usuarios reseteados a USER. Solo ${SUPER_ADMIN_EMAIL} tiene ADMIN.`
    });
}
