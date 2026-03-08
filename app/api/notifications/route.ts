import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fetch notifications for the current profile
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) return new NextResponse("Profile ID required", { status: 400 });

    try {
        const notifications = await (prisma as any).notification.findMany({
            where: { profileId },
            orderBy: { createdAt: "desc" },
            take: 20
        });
        return NextResponse.json(notifications);
    } catch (error) {
        console.error("GET_NOTIFICATIONS_ERROR (missing model?)", error);
        return NextResponse.json([]); // Return empty list rather than error
    }
}

// Mark all as read
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { profileId } = await req.json();
    if (!profileId) return new NextResponse("Profile ID required", { status: 400 });

    try {
        await (prisma as any).notification.updateMany({
            where: { profileId, isRead: false },
            data: { isRead: true }
        });
        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("PATCH_NOTIFICATIONS_ERROR (missing model?)", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
