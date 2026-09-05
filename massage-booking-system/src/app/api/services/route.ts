import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: public callers see only active services; a logged-in admin sees all.
export async function GET() {
  const session = await getAdminSession();
  const services = await prisma.service.findMany({
    where: session ? {} : { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ services });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  durationMin: z.number().int().positive(),
  priceTwd: z.number().int().nonnegative(),
  depositTwd: z.number().int().nonnegative().default(0),
  sortOrder: z.number().int().optional(),
});

// POST: admin-only — create a new service.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤", details: parsed.error.flatten() }, { status: 400 });
  }

  const service = await prisma.service.create({ data: parsed.data });
  return NextResponse.json({ service }, { status: 201 });
}
