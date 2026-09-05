import { prisma } from "@/lib/prisma";
import { formatTimeInShopZone } from "@/lib/date";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: start, lt: end } },
    include: { service: true, therapist: true },
    orderBy: { startAt: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-brand-800">今日預約（{bookings.length}）</h1>
      <div className="space-y-2">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-brand-800">
                {formatTimeInShopZone(b.startAt.toISOString())} · {b.service.name} · {b.therapist.name}
              </p>
              <p className="text-sm text-brand-500">
                {b.customerName}（{b.customerPhone}）
              </p>
            </div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700">
              {BOOKING_STATUS_LABELS[b.status as BookingStatus] ?? b.status}
            </span>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-brand-400">今天還沒有預約。</p>}
      </div>
    </div>
  );
}
