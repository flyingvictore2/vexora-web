import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const RESERVED = ["admin","root","vexora","support","staff","moderator","mod","system","official","help","api","null","undefined","anonymous"];
const VALID_RE = /^[a-z0-9_.]{3,20}$/;

export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json();

        if (!email || !password) return new NextResponse("Missing email or password", { status: 400 });

        // Validate username
        const cleanUsername = (username || "").trim().toLowerCase();
        if (!VALID_RE.test(cleanUsername)) return NextResponse.json({ error: "Nombre de usuario inválido. Solo letras minúsculas, números, puntos y guiones bajos (3-20 caracteres)" }, { status: 400 });
        if (RESERVED.includes(cleanUsername)) return NextResponse.json({ error: "Ese nombre de usuario está reservado" }, { status: 400 });

        const allowNewRegistrations = await prisma.setting.findUnique({ where: { key: "allowNewRegistrations" } });
        if (allowNewRegistrations?.value === "false") return new NextResponse("Registrations are currently disabled", { status: 403 });

        // Check email uniqueness
        const existEmail = await prisma.user.findUnique({ where: { email } });
        if (existEmail) return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 });

        // Check username uniqueness
        const existUser = await prisma.$queryRawUnsafe<any[]>(`SELECT id FROM "user" WHERE username = $1 LIMIT 1`, cleanUsername);
        if (existUser.length > 0) return NextResponse.json({ error: "Ese nombre de usuario ya está en uso" }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                updatedAt: new Date(),
                email,
                password: hashedPassword,
                username: cleanUsername,
                role: "USER",
                profile: {
                    create: {
                        id: crypto.randomUUID(),
                        name: "Principal",
                        isKid: false,
                        updatedAt: new Date(),
                    }
                }
            }
        });

        return NextResponse.json({ ok: true, id: user.id });
    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
