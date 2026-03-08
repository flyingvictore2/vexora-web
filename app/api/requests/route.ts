import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const { title, info } = body;

        if (!title) {
            return new NextResponse("El título es obligatorio", { status: 400 });
        }

        const request = await (prisma as any).contentRequest.create({
            data: {
                title,
                info: info || "",
                status: "PENDING",
                userEmail: session?.user?.email || null
            }
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error("Error creating content request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
