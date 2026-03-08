import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // We return success even if user not found for security (prevent email enum)
            return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." }, { status: 200 });
        }

        // 1. Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour validity

        // 2. Save token to DB
        await (prisma as any).passwordResetToken.create({
            data: {
                email: user.email!,
                token: resetToken,
                expiresAt: passwordResetExpires,
            }
        });

        // 3. Send email using Nodemailer
        console.log("--- DEBUG EMAIL ---");
        console.log("User:", process.env.EMAIL_USER);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // use STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Seriesly Support" <${process.env.EMAIL_USER}>`,
            to: user.email!,
            subject: 'Recuperación de Contraseña - Series.ly',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                    <h2 style="color: #2563eb;">Series.ly</h2>
                    <p>Has solicitado restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace caducará en 1 hora.</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Restablecer Contraseña</a>
                    <p style="color: #64748b; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `,
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully to", email);
        } else {
            console.warn("Nodemailer is not fully configured, token generated but email not sent.");
            console.log("Reset URL:", resetUrl);
        }

        return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace de recuperación." }, { status: 200 });

    } catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud" }, { status: 500 });
    }
}
