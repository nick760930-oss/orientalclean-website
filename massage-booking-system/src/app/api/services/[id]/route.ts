import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  durationMin: z.number().int().positive().optional(),
  priceTwd: z.number().int().nonnegative().optional(),
  depositTwd: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// PATCH: admin-only — edit a service, or set active:false to retire it
// (services with existing bookings are kept, not hard-deleted).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }

  const service = await prisma.service.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ service });
}
