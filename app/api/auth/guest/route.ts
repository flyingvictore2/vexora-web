import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/auth/guest — set a session-only guest cookie
export async function POST() {
    const res = NextResponse.json({ ok: true });
    // No max-age / expires → session cookie → deleted when browser closes
    res.cookies.set("vexora_guest", "1", {
        path: "/",
        sameSite: "lax",
        httpOnly: false, // needs to be readable by client JS for Navbar/AddToListButton
    });
    return res;
}

// DELETE /api/auth/guest — clear guest cookie (called on explicit logout)
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("vexora_guest", "", { path: "/", maxAge: 0 });
    return res;
}
