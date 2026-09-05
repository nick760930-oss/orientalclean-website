"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatTimeInShopZone } from "@/lib/date";

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceTwd: number;
  depositTwd: number;
  description?: string | null;
}

interface Therapist {
  id: string;
  name: string;
  bio?: string | null;
}

interface SlotOption {
  time: string;
  therapistIds: string[];
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STEP_LABELS = ["選擇服務", "選擇按摩師", "選擇時段", "填寫資料"];

export default function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(searchParams.get("serviceId") || "");
  const [therapistId, setTherapistId] = useState(""); // "" = 不指定
  const [date, setDate] = useState(todayStr());
  const [selectedTime, setSelectedTime] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"store" | "stripe">("store");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onlinePaymentEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const selectedTherapist = useMemo(
    () => therapists.find((t) => t.id === therapistId),
    [therapists, therapistId]
  );

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, []);

  useEffect(() => {
    setTherapistId("");
    if (!serviceId) {
      setTherapists([]);
      return;
    }
    fetch(`/api/therapists?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((d) => setTherapists(d.therapists ?? []));
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !date || step < 3) return;
    setLoadingSlots(true);
    setError("");
    const params = new URLSearchParams({ serviceId, date });
    if (therapistId) params.set("therapistId", therapistId);
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setError("讀取可預約時段時發生錯誤，請重新整理再試一次。"))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, therapistId, date, step]);

  function goToTherapistStep() {
    if (!serviceId) {
      setError("請先選擇服務項目");
      return;
    }
    setError("");
    setStep(2);
  }

  function goToTimeStep() {
    setError("");
    setSelectedTime("");
    setStep(3);
  }

  function goToContactStep() {
    if (!selectedTime) {
      setError("請選擇預約時段");
      return;
    }
    setError("");
    setStep(4);
  }

  async function submitBooking() {
    if (!name.trim() || !phone.trim()) {
      setError("請填寫姓名與聯絡電話");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          therapistId: therapistId || undefined,
          startAt: selectedTime,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          notes: notes.trim() || undefined,
          paymentMethod,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "預約失敗，請稍後再試。");
        if (res.status === 409) {
          setStep(3);
          setSelectedTime("");
        }
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      router.push(`/booking/confirm?bookingId=${data.booking.id}`);
    } catch {
      setError("網路連線錯誤，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  const amountDue = selectedService ? (selectedService.depositTwd > 0 ? selectedService.depositTwd : selectedService.priceTwd) : 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <ol className="mb-6 flex justify-between text-xs text-brand-400">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className={i + 1 === step ? "font-semibold text-brand-700" : ""}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-800">選擇服務項目</h2>
          {services.map((s) => (
            <label
              key={s.id}
              className={`block cursor-pointer rounded-xl border p-4 transition ${
                serviceId === s.id ? "border-brand-600 bg-brand-50" : "border-brand-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="service"
                className="sr-only"
                checked={serviceId === s.id}
                onChange={() => setServiceId(s.id)}
              />
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-800">{s.name}</span>
                <span className="text-sm text-brand-500">NT$ {s.priceTwd}</span>
              </div>
              <p className="text-xs text-brand-400">{s.durationMin} 分鐘</p>
            </label>
          ))}
          <button
            onClick={goToTherapistStep}
            className="mt-4 w-full rounded-full bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
          >
            下一步
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-800">選擇按摩師 / 包廂</h2>
          <label
            className={`block cursor-pointer rounded-xl border p-4 ${
              therapistId === "" ? "border-brand-600 bg-brand-50" : "border-brand-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="therapist"
              className="sr-only"
              checked={therapistId === ""}
              onChange={() => setTherapistId("")}
            />
            <span className="font-medium text-brand-800">不指定，都可以</span>
          </label>
          {therapists.map((t) => (
            <label
              key={t.id}
              className={`block cursor-pointer rounded-xl border p-4 ${
                therapistId === t.id ? "border-brand-600 bg-brand-50" : "border-brand-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="therapist"
                className="sr-only"
                checked={therapistId === t.id}
                onChange={() => setTherapistId(t.id)}
              />
              <span className="font-medium text-brand-800">{t.name}</span>
              {t.bio && <p className="text-xs text-brand-400">{t.bio}</p>}
            </label>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-brand-300 py-3 text-brand-700">
              上一步
            </button>
            <button
              onClick={goToTimeStep}
              className="flex-1 rounded-full bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
            >
              下一步
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-800">選擇日期與時段</h2>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedTime("");
            }}
            className="w-full rounded-lg border border-brand-300 px-3 py-2"
          />
          {loadingSlots && <p className="text-sm text-brand-400">讀取可預約時段中…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-brand-400">這天沒有可預約的時段了，請換一天試試。</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {slots.map((s) => (
              <button
                key={s.time}
                onClick={() => setSelectedTime(s.time)}
                className={`rounded-lg border py-2 text-sm ${
                  selectedTime === s.time
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-brand-200 bg-white text-brand-700 hover:border-brand-400"
                }`}
              >
                {formatTimeInShopZone(s.time)}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-full border border-brand-300 py-3 text-brand-700">
              上一步
            </button>
            <button
              onClick={goToContactStep}
              className="flex-1 rounded-full bg-brand-600 py-3 font-medium text-white hover:bg-brand-700"
            >
              下一步
            </button>
          </div>
        </section>
      )}

      {step === 4 && selectedService && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-800">填寫聯絡資料</h2>
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
            <p>{selectedService.name}（{selectedService.durationMin} 分鐘）</p>
            <p>{selectedTherapist ? selectedTherapist.name : "不指定按摩師"}</p>
            <p>{formatTimeInShopZone(selectedTime)}｜{date}</p>
            <p className="mt-1 font-medium">總金額 NT$ {selectedService.priceTwd}</p>
          </div>

          <div className="space-y-3">
            <input
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-brand-300 px-3 py-2"
            />
            <input
              placeholder="聯絡電話"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-brand-300 px-3 py-2"
            />
            <input
              placeholder="Email（選填）"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-brand-300 px-3 py-2"
            />
            <textarea
              placeholder="備註（選填，例如：加強部位、身體狀況）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-brand-300 px-3 py-2"
              rows={3}
            />
          </div>

          {onlinePaymentEnabled && (selectedService.depositTwd > 0 || selectedService.priceTwd > 0) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-700">付款方式</p>
              <label className="flex items-center gap-2 text-sm text-brand-700">
                <input
                  type="radio"
                  checked={paymentMethod === "store"}
                  onChange={() => setPaymentMethod("store")}
                />
                到店付款
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-700">
                <input
                  type="radio"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                />
                線上付款{selectedService.depositTwd > 0 ? `訂金 NT$ ${amountDue}` : `全額 NT$ ${amountDue}`}
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 rounded-full border border-brand-300 py-3 text-brand-700">
              上一步
            </button>
            <button
              onClick={submitBooking}
              disabled={submitting}
              className="flex-1 rounded-full bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "送出中…" : "確認預約"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
