import { prisma } from "@/lib/prisma";
import { addMinutes, dateAtMinutes } from "@/lib/date";
import type { PaymentMethod } from "@/lib/constants";

export class BookingConflictError extends Error {}

export interface CreateBookingInput {
  serviceId: string;
  therapistId?: string; // omit for "no preference" — server assigns a qualified, free therapist
  startAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

/**
 * Creates a booking, re-validating availability inside a transaction so two
 * customers racing for the same slot can't both succeed.
 */
export async function createBooking(input: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    const service = await tx.service.findUnique({ where: { id: input.serviceId } });
    if (!service || !service.active) {
      throw new BookingConflictError("找不到這個服務項目，請重新選擇。");
    }

    const endAt = addMinutes(input.startAt, service.durationMin);
    const dayOfWeek = input.startAt.getDay();

    const candidates = await tx.therapist.findMany({
      where: {
        active: true,
        ...(input.therapistId ? { id: input.therapistId } : {}),
        services: { some: { serviceId: input.serviceId } },
      },
      include: {
        weeklyHours: { where: { dayOfWeek } },
        timeOffs: { where: { startAt: { lt: endAt }, endAt: { gt: input.startAt } } },
        bookings: {
          where: {
            startAt: { lt: endAt },
            endAt: { gt: input.startAt },
            status: { not: "CANCELLED" },
          },
        },
      },
    });

    const chosen = candidates.find((t) => {
      const withinWorkingHours = t.weeklyHours.some((w) => {
        const start = dateAtMinutes(input.startAt, w.startMin);
        const end = dateAtMinutes(input.startAt, w.endMin);
        return input.startAt >= start && endAt <= end;
      });
      return withinWorkingHours && t.timeOffs.length === 0 && t.bookings.length === 0;
    });

    if (!chosen) {
      throw new BookingConflictError("這個時段剛好被預約走了，請重新選擇時段。");
    }

    const depositOrFull = service.depositTwd > 0 ? service.depositTwd : service.priceTwd;
    const amountDueTwd = input.paymentMethod === "stripe" ? depositOrFull : 0;

    return tx.booking.create({
      data: {
        serviceId: service.id,
        therapistId: chosen.id,
        startAt: input.startAt,
        endAt,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        notes: input.notes,
        status: "PENDING",
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "stripe" ? "AWAITING" : "NONE",
        amountDueTwd,
      },
      include: { service: true, therapist: true },
    });
  });
}
