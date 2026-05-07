import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const RESERVED = ["admin","root","vexora","support","staff","moderator","mod","system","official","help","api","null","undefined","anonymous"];
const VALID_RE = /^[a-z0-9_.]{3,20}$/;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { username } = await req.json();
    const clean = (username || "").trim().toLowerCase();

    if (!VALID_RE.test(clean)) return NextResponse.json({ error: "Solo letras minúsculas, números, puntos y guiones bajos (3-20 caracteres)" }, { status: 400 });
    if (RESERVED.includes(clean)) return NextResponse.json({ error: "Este nombre está reservado" }, { status: 400 });

    try {
        // Check uniqueness
        const existing = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "user" WHERE username = $1 LIMIT 1`, clean
        );
        if (existing.length > 0) return NextResponse.json({ error: "Este nombre de usuario ya está en uso" }, { status: 409 });

        await prisma.$executeRawUnsafe(
            `UPDATE "user" SET username = $1, "updatedAt" = $2::timestamp WHERE email = $3`,
            clean, new Date().toISOString(), session.user.email
        );
        return NextResponse.json({ ok: true, username: clean });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
