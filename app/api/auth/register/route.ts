import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new NextResponse("Missing email or password", { status: 400 });
        }

        const allowNewRegistrations = await prisma.setting.findUnique({
            where: { key: "allowNewRegistrations" }
        });

        if (allowNewRegistrations?.value === "false") {
            return new NextResponse("Registrations are currently disabled", { status: 403 });
        }

        const exist = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (exist) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Super admin siempre obtiene rol ADMIN
        const isSuperAdmin = email === "flyingvictor2006@gmail.com";

        const user = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                updatedAt: new Date(),
                email,
                password: hashedPassword,
                role: isSuperAdmin ? "ADMIN" : "USER",
                // Create a default profile
                profile: {
                    create: {
                        id: crypto.randomUUID(),
                        name: "Profile 1",
                        isKid: false,
                        updatedAt: new Date()
                    }
                }
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
