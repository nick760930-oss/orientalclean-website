import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "按摩店";
  const shopNameEn = process.env.NEXT_PUBLIC_SHOP_NAME_EN;
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE;
  const shopHours = process.env.NEXT_PUBLIC_SHOP_HOURS;

  return (
    <main>
      <section className="relative overflow-hidden bg-brand-950 px-6 py-24 text-center text-brand-50">
        <div className="hero-slats pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            傳統泰式按摩
          </p>
          <h1 className="mt-5 font-serif text-5xl font-semibold tracking-wide">{shopName}</h1>
          {shopNameEn && (
            <p className="mt-3 text-sm uppercase tracking-[0.5em] text-slate-500">{shopNameEn}</p>
          )}
          <p className="mx-auto mt-8 max-w-xs text-sm leading-relaxed text-brand-200">
            純粹的泰式手法，讓身體慢下來。線上預約，選好時段即可到店放鬆。
          </p>
          {(shopHours || shopPhone) && (
            <p className="mt-6 text-xs tracking-wide text-brand-300">
              {shopHours}
              {shopHours && shopPhone && "　·　"}
              {shopPhone}
            </p>
          )}
        </div>
      </section>

      <div className="slat-divider" aria-hidden="true" />

      <section className="mx-auto max-w-xl px-6 py-16">
        <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-brand-400">
          Menu
        </p>
        <h2 className="mt-2 text-center font-serif text-2xl text-brand-900">服務項目</h2>

        <div className="mt-10 divide-y divide-brand-200">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/booking?serviceId=${s.id}`}
              className="group flex items-start justify-between gap-6 py-6 transition hover:bg-brand-100/40"
            >
              <div>
                <h3 className="font-serif text-lg text-brand-900">{s.name}</h3>
                {s.description && (
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-brand-500">
                    {s.description}
                  </p>
                )}
                {s.depositTwd > 0 && (
                  <p className="mt-1.5 text-xs text-brand-400">需付訂金 NT$ {s.depositTwd}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs uppercase tracking-wide text-brand-400">
                  {s.durationMin} 分鐘
                </p>
                <p className="mt-1 font-serif text-xl text-brand-900">NT$ {s.priceTwd}</p>
                <p className="mt-2 text-xs text-brand-500 transition group-hover:text-brand-700">
                  預約 →
                </p>
              </div>
            </Link>
          ))}
          {services.length === 0 && (
            <p className="py-10 text-center text-brand-400">
              目前尚無可預約的服務項目，請聯絡店家。
            </p>
          )}
        </div>
      </section>

      <div className="slat-divider" aria-hidden="true" />

      <footer className="px-6 py-8 text-center">
        <Link href="/admin" className="text-xs text-brand-300 hover:text-brand-500">
          商家後台
        </Link>
      </footer>
    </main>
  );
}
