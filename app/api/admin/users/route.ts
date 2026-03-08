import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                subscription: true
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, userId, role, plan } = body;

        if (!userId || !action) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        if (action === "CHANGE_ROLE") {
            const user = await prisma.user.update({
                where: { id: userId },
                data: { role }
            });
            return NextResponse.json(user);
        }

        if (action === "CHANGE_PLAN") {
            if (plan === "FREE") {
                // Delete subscription if changing to FREE
                await prisma.subscription.deleteMany({
                    where: { userId }
                });
            } else {
                // Upsert subscription for paid plans
                // Next billing date is 1 month from now
                const nextBillingDate = new Date();
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

                await prisma.subscription.upsert({
                    where: { userId },
                    update: {
                        plan,
                        status: "ACTIVE",
                        nextBillingDate
                    },
                    create: {
                        id: crypto.randomUUID(),
                        userId,
                        plan,
                        status: "ACTIVE",
                        nextBillingDate
                    }
                });
            }
            return NextResponse.json({ success: true });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("Error updating user role:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
