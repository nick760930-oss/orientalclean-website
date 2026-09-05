"use client";

import { useEffect, useState } from "react";
import { formatDateInShopZone, formatTimeInShopZone } from "@/lib/date";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, type BookingStatus, type PaymentStatus } from "@/lib/constants";

interface BookingRow {
  id: string;
  startAt: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  service: { name: string };
  therapist: { name: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-brand-800">預約管理</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm"
        >
          <option value="">全部狀態</option>
          {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-brand-400">載入中…</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-brand-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-brand-800">
                    {formatDateInShopZone(b.startAt)} {formatTimeInShopZone(b.startAt)} · {b.service.name} ·{" "}
                    {b.therapist.name}
                  </p>
                  <p className="text-sm text-brand-500">
                    {b.customerName}（{b.customerPhone}）
                    {b.notes && ` · 備註：${b.notes}`}
                  </p>
                  <p className="text-xs text-brand-400">
                    {BOOKING_STATUS_LABELS[b.status as BookingStatus] ?? b.status} ·{" "}
                    {PAYMENT_STATUS_LABELS[b.paymentStatus as PaymentStatus] ?? b.paymentStatus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "PENDING" && (
                    <button
                      onClick={() => updateStatus(b.id, "CONFIRMED")}
                      className="rounded-full bg-brand-600 px-3 py-1 text-xs text-white"
                    >
                      確認
                    </button>
                  )}
                  {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, "COMPLETED")}
                        className="rounded-full border border-brand-300 px-3 py-1 text-xs text-brand-700"
                      >
                        完成
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "NO_SHOW")}
                        className="rounded-full border border-brand-300 px-3 py-1 text-xs text-brand-700"
                      >
                        未到店
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "CANCELLED")}
                        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600"
                      >
                        取消
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-brand-400">沒有符合條件的預約。</p>}
        </div>
      )}
    </div>
  );
}
