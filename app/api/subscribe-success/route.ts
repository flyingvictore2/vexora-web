import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
        return redirect("/plans");
    }

    try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        const userId = checkoutSession.metadata?.userId;
        const planId = checkoutSession.metadata?.planId;

        if (userId && planId) {
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            await prisma.subscription.upsert({
                where: { userId: userId },
                update: {
                    plan: planId,
                    status: "ACTIVE",
                    nextBillingDate: nextBillingDate
                },
                create: {
                    id: crypto.randomUUID(),
                    userId: userId,
                    plan: planId,
                    status: "ACTIVE",
                    nextBillingDate: nextBillingDate
                }
            });
        }

        return redirect("/");
    } catch (error) {
        console.error("SUCCESS_HANDLER_ERROR", error);
        return redirect("/plans");
    }
}
