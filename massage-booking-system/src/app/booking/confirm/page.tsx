import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatDateInShopZone, formatTimeInShopZone } from "@/lib/date";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, type BookingStatus, type PaymentStatus } from "@/lib/constants";

async function ConfirmContent({ bookingId }: { bookingId?: string }) {
  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { service: true, therapist: true },
      })
    : null;

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-brand-600">找不到這筆預約資料。</p>
        <Link href="/" className="mt-4 inline-block text-brand-500 underline">
          回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">
        ✓
      </div>
      <h1 className="text-xl font-semibold text-brand-800">預約已送出</h1>
      <div className="mt-6 space-y-1 rounded-xl border border-brand-200 bg-white p-5 text-left text-sm text-brand-700">
        <p className="font-medium">{booking.service.name}</p>
        <p>按摩師 / 包廂：{booking.therapist.name}</p>
        <p>
          時間：{formatDateInShopZone(booking.startAt.toISOString())}{" "}
          {formatTimeInShopZone(booking.startAt.toISOString())}
        </p>
        <p>姓名：{booking.customerName}</p>
        <p>電話：{booking.customerPhone}</p>
        <p className="pt-2">
          預約狀態：{BOOKING_STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}
        </p>
        <p>付款狀態：{PAYMENT_STATUS_LABELS[booking.paymentStatus as PaymentStatus] ?? booking.paymentStatus}</p>
      </div>
      <Link href="/" className="mt-6 inline-block text-brand-500 underline">
        回首頁
      </Link>
    </div>
  );
}

export default function BookingConfirmPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-brand-400">載入中…</div>}>
      <ConfirmContent bookingId={searchParams.bookingId} />
    </Suspense>
  );
}
