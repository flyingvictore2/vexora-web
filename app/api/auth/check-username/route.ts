import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RESERVED = ["admin","root","vexora","support","staff","moderator","mod","system","official","help","api","null","undefined","anonymous"];
const VALID_RE = /^[a-z0-9_.]{3,20}$/;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("username") || "").trim().toLowerCase();

    if (!raw) return NextResponse.json({ available: false, error: "Escribe un nombre de usuario" });
    if (!VALID_RE.test(raw)) return NextResponse.json({ available: false, error: "Solo letras minúsculas, números, puntos y guiones bajos (3-20 caracteres)" });
    if (RESERVED.includes(raw)) return NextResponse.json({ available: false, error: "Este nombre está reservado" });

    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "user" WHERE username = $1 LIMIT 1`, raw
        );
        if (rows.length > 0) return NextResponse.json({ available: false, error: "Este nombre de usuario ya está en uso" });
        return NextResponse.json({ available: true });
    } catch {
        return NextResponse.json({ available: false, error: "Error al comprobar disponibilidad" });
    }
}
