import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe webhook: marks a booking as paid + confirmed once checkout completes.
// Configure this URL (…/api/webhooks/stripe) in the Stripe Dashboard and set
// STRIPE_WEBHOOK_SECRET to the signing secret it gives you.
export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe 未設定" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "缺少 stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Webhook 簽章驗證失敗" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      // Only flip PENDING bookings — avoids resurrecting one an admin already cancelled.
      await prisma.booking
        .updateMany({
          where: { id: bookingId, status: "PENDING" },
          data: { paymentStatus: "PAID", status: "CONFIRMED" },
        })
        .catch((err) => console.error(`Failed to mark booking ${bookingId} as paid`, err));
    }
  }

  return NextResponse.json({ received: true });
}
