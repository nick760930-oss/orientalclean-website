import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const weeklyHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  serviceIds: z.array(z.string()).optional(),
  weeklyHours: z.array(weeklyHourSchema).optional(),
});

// PATCH: admin-only — edit a therapist. Passing serviceIds or weeklyHours
// replaces that therapist's full set (simplest correct semantics for a form
// that submits the whole weekly schedule / service list at once).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }
  const { serviceIds, weeklyHours, ...data } = parsed.data;

  const therapist = await prisma.$transaction(async (tx) => {
    if (serviceIds) {
      await tx.therapistService.deleteMany({ where: { therapistId: params.id } });
      if (serviceIds.length > 0) {
        await tx.therapistService.createMany({
          data: serviceIds.map((serviceId) => ({ therapistId: params.id, serviceId })),
        });
      }
    }
    if (weeklyHours) {
      await tx.weeklyAvailability.deleteMany({ where: { therapistId: params.id } });
      if (weeklyHours.length > 0) {
        await tx.weeklyAvailability.createMany({
          data: weeklyHours.map((w) => ({ ...w, therapistId: params.id })),
        });
      }
    }
    return tx.therapist.update({
      where: { id: params.id },
      data,
      include: { weeklyHours: true, services: true },
    });
  });

  return NextResponse.json({ therapist });
}
