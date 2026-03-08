import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { planId, price, planName } = await request.json();

        if (!planId || !price) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `Plan Series.ly: ${planName}`,
                            description: `Suscripción mensual al plan ${planName}`,
                        },
                        unit_amount: Math.round(parseFloat(price) * 100),
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXTAUTH_URL}/api/subscribe-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/plans`,
            metadata: {
                userId: (session.user as any).id,
                planId: planId,
            },
            customer_email: session.user.email,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("STRIPE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
