import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBooking, BookingConflictError } from "@/lib/booking";
import { createCheckoutSession } from "@/lib/stripe";
import { isOnlinePaymentEnabled } from "@/lib/constants";

const createSchema = z.object({
  serviceId: z.string().min(1),
  therapistId: z.string().min(1).optional(),
  startAt: z.string().datetime(),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(6).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["store", "stripe"]),
  origin: z.string().url().optional(),
});

// GET: admin-only booking list, optionally filtered by date range / status.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: {
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(status ? { status } : {}),
    },
    include: { service: true, therapist: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ bookings });
}

// POST: public — a customer submits a new booking request.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const paymentMethod = input.paymentMethod === "stripe" && isOnlinePaymentEnabled() ? "stripe" : "store";

  try {
    const booking = await createBooking({
      serviceId: input.serviceId,
      therapistId: input.therapistId,
      startAt: new Date(input.startAt),
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || undefined,
      notes: input.notes,
      paymentMethod,
    });

    if (paymentMethod === "stripe") {
      const origin = input.origin || req.nextUrl.origin;
      const session = await createCheckoutSession({
        bookingId: booking.id,
        serviceName: booking.service.name,
        amountTwd: booking.amountDueTwd,
        customerEmail: input.customerEmail || undefined,
        successUrl: `${origin}/booking/confirm?bookingId=${booking.id}`,
        cancelUrl: `${origin}/booking?cancelled=1`,
      });

      if (session?.url) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripeSessionId: session.id },
        });
        return NextResponse.json({ booking, checkoutUrl: session.url });
      }
    }

    return NextResponse.json({ booking, checkoutUrl: null });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "建立預約時發生錯誤，請稍後再試。" }, { status: 500 });
  }
}
