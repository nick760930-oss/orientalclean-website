import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatDateInShopZone, formatTimeInShopZone } from "@/lib/date";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type BookingStatus,
  type PaymentStatus,
  type PaymentMethod,
} from "@/lib/constants";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-brand-100 py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-brand-400">{label}</span>
      <span className="text-right text-sm text-brand-900">{value}</span>
    </div>
  );
}

async function ConfirmContent({ bookingId }: { bookingId?: string }) {
  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { service: true, therapist: true },
      })
    : null;

  if (!booking) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-brand-500">找不到這筆預約資料。</p>
        <Link href="/" className="mt-4 inline-block text-sm text-brand-600 underline underline-offset-4">
          回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-700">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none" aria-hidden="true">
          <path
            d="M5 12.5 9.5 17 19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-6 font-serif text-2xl text-brand-900">預約已送出</h1>
      <p className="mt-2 text-sm text-brand-500">我們已收到您的預約，請留意以下資訊。</p>

      <div className="mt-8 rounded-md border border-brand-200 bg-white p-6 text-left">
        <p className="mb-1 font-serif text-lg text-brand-900">{booking.service.name}</p>
        <div className="mt-4">
          <Row label="按摩師／包廂" value={booking.therapist.name} />
          <Row
            label="時間"
            value={`${formatDateInShopZone(booking.startAt.toISOString())} ${formatTimeInShopZone(
              booking.startAt.toISOString()
            )}`}
          />
          <Row label="姓名" value={booking.customerName} />
          <Row label="電話" value={booking.customerPhone} />
          <Row
            label="付款方式"
            value={PAYMENT_METHOD_LABELS[booking.paymentMethod as PaymentMethod] ?? booking.paymentMethod ?? "—"}
          />
          <Row
            label="預約狀態"
            value={BOOKING_STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}
          />
          <Row
            label="付款狀態"
            value={PAYMENT_STATUS_LABELS[booking.paymentStatus as PaymentStatus] ?? booking.paymentStatus}
          />
        </div>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-brand-600 underline underline-offset-4">
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
    <Suspense fallback={<div className="px-6 py-16 text-center text-brand-400">載入中…</div>}>
      <ConfirmContent bookingId={searchParams.bookingId} />
    </Suspense>
  );
}
