import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: public callers pass ?serviceId= to get active therapists qualified
// for that service (for the customer therapist-picker step). A logged-in
// admin with no serviceId gets every therapist, active or not.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") || undefined;

  const therapists = await prisma.therapist.findMany({
    where: {
      ...(session ? {} : { active: true }),
      ...(serviceId ? { services: { some: { serviceId } } } : {}),
    },
    include: { weeklyHours: true, services: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ therapists });
}

const weeklyHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  sortOrder: z.number().int().optional(),
  serviceIds: z.array(z.string()).default([]),
  weeklyHours: z.array(weeklyHourSchema).default([]),
});

// POST: admin-only — create a therapist (or bookable room) with the
// services they can perform and their recurring weekly hours.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }
  const { serviceIds, weeklyHours, ...data } = parsed.data;

  const therapist = await prisma.therapist.create({
    data: {
      ...data,
      services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
      weeklyHours: { create: weeklyHours },
    },
    include: { weeklyHours: true, services: true },
  });

  return NextResponse.json({ therapist }, { status: 201 });
}
