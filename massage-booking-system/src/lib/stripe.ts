import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    })
  : null;

/**
 * Creates a Stripe Checkout session for a booking's deposit/payment. Returns
 * null when Stripe isn't configured (STRIPE_SECRET_KEY unset) — callers
 * should fall back to "pay at store" in that case.
 */
export async function createCheckoutSession(params: {
  bookingId: string;
  serviceName: string;
  amountTwd: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) return null;

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "twd",
          unit_amount: params.amountTwd, // TWD is zero-decimal on Stripe: amount == whole NT$ dollars
          product_data: { name: params.serviceName },
        },
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { bookingId: params.bookingId },
  });
}
