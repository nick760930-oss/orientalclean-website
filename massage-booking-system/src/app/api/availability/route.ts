import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { parseDateOnly } from "@/lib/date";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const dateParam = searchParams.get("date");
  const therapistId = searchParams.get("therapistId") || undefined;

  if (!serviceId || !dateParam) {
    return NextResponse.json({ error: "缺少 serviceId 或 date 參數" }, { status: 400 });
  }

  const date = parseDateOnly(dateParam);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "date 格式錯誤，需為 YYYY-MM-DD" }, { status: 400 });
  }

  const slots = await getAvailableSlots({ serviceId, date, therapistId });

  return NextResponse.json({
    slots: slots.map((s) => ({ time: s.time.toISOString(), therapistIds: s.therapistIds })),
  });
}
