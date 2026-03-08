import Stripe from "stripe";

// Lazy initialization - only creates Stripe instance when called,
// not at module load time. This prevents build failures when env vars are missing.
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }
        stripeInstance = new Stripe(key, {
            apiVersion: "2024-06-20" as any,
            typescript: true,
        });
    }
    return stripeInstance;
}

// Keep backward compatibility
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripe() as any)[prop];
    }
});
