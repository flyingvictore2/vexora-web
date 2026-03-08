import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token y contraseña son obligatorios" }, { status: 400 });
        }

        // 1. Verify token exists and is valid
        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetRecord) {
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        if (new Date() > resetRecord.expiresAt) {
            // Delete expired token
            await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
            return NextResponse.json({ error: "El token ha expirado" }, { status: 400 });
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update user password
        await prisma.user.update({
            where: { email: resetRecord.email },
            data: { password: hashedPassword }
        });

        // 4. Delete the used token
        await prisma.passwordResetToken.delete({
            where: { id: resetRecord.id }
        });

        return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: 200 });

    } catch (error: any) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud" }, { status: 500 });
    }
}
