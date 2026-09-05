import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUSES } from "@/lib/constants";

// GET: public — used by the post-booking confirmation page. The booking id
// (a cuid) acts as the access token; no admin session required.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true, therapist: true },
  });
  if (!booking) return NextResponse.json({ error: "找不到這筆預約" }, { status: 404 });
  return NextResponse.json({ booking });
}

const patchSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  notes: z.string().max(500).optional(),
});

// PATCH: admin-only — confirm / cancel / mark complete / no-show, or edit notes.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id: params.id },
    data: parsed.data,
    include: { service: true, therapist: true },
  });

  return NextResponse.json({ booking });
}
