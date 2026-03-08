import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { plan } = await request.json();

        if (!plan) {
            return new NextResponse("Missing plan", { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Calculate next billing date (1 month from now)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Update or create subscription
        const subscription = await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
                plan: plan,
                status: "ACTIVE",
                nextBillingDate: nextBillingDate
            },
            create: {
                id: crypto.randomUUID(),
                userId: user.id,
                plan: plan,
                status: "ACTIVE",
                nextBillingDate: nextBillingDate
            }
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("SUBSCRIBE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
