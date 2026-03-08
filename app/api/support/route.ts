import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return new NextResponse("Faltan campos obligatorios", { status: 400 });
        }

        const ticket = await (prisma as any).supportTicket.create({
            data: {
                name,
                email,
                subject,
                message,
                status: "PENDING"
            }
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Error creating support ticket:", error);
        return new NextResponse("Error interno del servidor", { status: 500 });
    }
}
