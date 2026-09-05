import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SLOT_STEP_MIN } from "@/lib/constants";
import { addMinutes, ceilToStep, dateAtMinutes } from "@/lib/date";

interface Interval {
  start: Date;
  end: Date;
}

/** Subtracts each interval in `blocked` from the free windows in `base`. */
function subtractIntervals(base: Interval[], blocked: Interval[]): Interval[] {
  let result = base;
  for (const sub of blocked) {
    const next: Interval[] = [];
    for (const b of result) {
      if (sub.end <= b.start || sub.start >= b.end) {
        next.push(b);
        continue;
      }
      if (sub.start > b.start) {
        next.push({ start: b.start, end: sub.start < b.end ? sub.start : b.end });
      }
      if (sub.end < b.end) {
        next.push({ start: sub.end > b.start ? sub.end : b.start, end: b.end });
      }
    }
    result = next.filter((iv) => iv.end > iv.start);
  }
  return result;
}

function generateSlotStarts(windows: Interval[], durationMin: number, now: Date): Date[] {
  const starts: Date[] = [];
  for (const w of windows) {
    let cursor = ceilToStep(w.start, SLOT_STEP_MIN);
    while (addMinutes(cursor, durationMin) <= w.end) {
      if (cursor > now) starts.push(cursor);
      cursor = addMinutes(cursor, SLOT_STEP_MIN);
    }
  }
  return starts;
}

export interface SlotOption {
  time: Date;
  therapistIds: string[];
}

/**
 * Returns bookable start times for a service on a given date, along with
 * which qualified therapist(s) are free at each time. When `therapistId` is
 * given, only that therapist is considered.
 */
export async function getAvailableSlots({
  serviceId,
  date,
  therapistId,
}: {
  serviceId: string;
  date: Date;
  therapistId?: string;
}): Promise<SlotOption[]> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return [];

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dayOfWeek = date.getDay();

  const therapists = await prisma.therapist.findMany({
    where: {
      active: true,
      ...(therapistId ? { id: therapistId } : {}),
      services: { some: { serviceId } },
    },
    include: {
      weeklyHours: { where: { dayOfWeek } },
      timeOffs: { where: { startAt: { lt: dayEnd }, endAt: { gt: dayStart } } },
      bookings: {
        where: {
          startAt: { lt: dayEnd },
          endAt: { gt: dayStart },
          status: { not: "CANCELLED" },
        },
      },
    },
  });

  const now = new Date();
  const byTime = new Map<number, Set<string>>();

  for (const t of therapists) {
    const workWindows = t.weeklyHours.map((w) => ({
      start: dateAtMinutes(date, w.startMin),
      end: dateAtMinutes(date, w.endMin),
    }));
    const afterTimeOff = subtractIntervals(
      workWindows,
      t.timeOffs.map((o) => ({ start: o.startAt, end: o.endAt }))
    );
    const freeWindows = subtractIntervals(
      afterTimeOff,
      t.bookings.map((b) => ({ start: b.startAt, end: b.endAt }))
    );

    for (const start of generateSlotStarts(freeWindows, service.durationMin, now)) {
      const key = start.getTime();
      if (!byTime.has(key)) byTime.set(key, new Set());
      byTime.get(key)!.add(t.id);
    }
  }

  return Array.from(byTime.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, therapistIds]) => ({ time: new Date(time), therapistIds: Array.from(therapistIds) }));
}
